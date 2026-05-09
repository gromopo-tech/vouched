/**
 * seed_devnet.ts — Submit a small set of reviews to the Vouched devnet program.
 *
 * Run with:
 *   ANCHOR_PROVIDER_URL=https://api.devnet.solana.com \
 *   ANCHOR_WALLET=~/.config/solana/id.json \
 *   npx ts-node scripts/seed_devnet.ts [--reviewee <pubkey>]
 *
 * Prerequisites:
 *   - Solana CLI wallet funded with devnet SOL (`solana airdrop 2`)
 *   - Program already deployed at A1sSsTDoDrBkJ96fuHo9G89gHsEXVvcW6tNV39AfyWbF
 *
 * Output:
 *   Prints a JSON array of submitted reviews to stdout, which can be cached
 *   in chat/eval/onchain_seed_data.json for reproducible evals.
 *
 * Notes:
 *   - PDA = [reviewee, reviewer], so each wallet can only submit one review per
 *     restaurant. Duplicate submissions are skipped with a warning.
 *   - Uses the default wallet from ANCHOR_WALLET; swap keypairs to simulate
 *     multiple reviewers.
 */

import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import type { Review } from '../target/types/review';
import { getReviewProgram, REVIEW_PROGRAM_ID } from '../src/review-exports';

// ---------------------------------------------------------------------------
// Seed data — 8 varied reviews for a single demo restaurant
// ---------------------------------------------------------------------------

const SEED_REVIEWS = [
  { comment: 'The roast duck sandwich was incredible. Perfect balance of flavours.', rating: 5 },
  { comment: 'Solid spot. Rueben was fresh and the fries crispy. Will be back.', rating: 4 },
  { comment: 'Service was slow but the food made up for it. Duck is a must-order.', rating: 4 },
  { comment: 'Pretty good for the price. Nothing groundbreaking but consistently tasty.', rating: 3 },
  { comment: 'Best sandwich spot in the neighbourhood. Portions are generous.', rating: 5 },
  { comment: 'Disappointing visit — sandwich was dry and the bread stale.', rating: 2 },
  { comment: 'Loved the vibe and the food. The duck confit melt is underrated.', rating: 5 },
  { comment: 'Good quality ingredients. Wish they had more vegetarian options.', rating: 3 },
];

async function main() {
  // Parse optional --reviewee flag
  const args = process.argv.slice(2);
  const revieweeIdx = args.indexOf('--reviewee');
  let revieweePubkey: PublicKey;

  if (revieweeIdx !== -1 && args[revieweeIdx + 1]) {
    revieweePubkey = new PublicKey(args[revieweeIdx + 1]);
  } else {
    // Generate a stable throwaway keypair to use as the demo restaurant wallet
    const seed = Buffer.alloc(32, 'gromopo-demo-restaurant');
    revieweePubkey = PublicKey.createProgramAddressSync(
      [seed],
      REVIEW_PROGRAM_ID,
    );
    // Fallback: use a deterministic pubkey derived from a known string
  }

  console.error(`Reviewee (restaurant wallet): ${revieweePubkey.toBase58()}`);

  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = getReviewProgram(provider) as Program<Review>;

  const results: object[] = [];

  for (const { comment, rating } of SEED_REVIEWS) {
    const [pda] = PublicKey.findProgramAddressSync(
      [revieweePubkey.toBuffer(), provider.wallet.publicKey.toBuffer()],
      program.programId,
    );

    // Skip if already submitted (PDA already exists)
    const existing = await provider.connection.getAccountInfo(pda);
    if (existing) {
      console.error(`Skipping — PDA ${pda.toBase58()} already exists (already reviewed).`);
      const account = await program.account.review.fetch(pda);
      results.push({
        pda: pda.toBase58(),
        reviewer: provider.wallet.publicKey.toBase58(),
        reviewee: revieweePubkey.toBase58(),
        rating: account.rating,
        comment: account.comment,
        skipped: true,
      });
      continue;
    }

    try {
      const sig = await (program.methods as any)
        .addReview(revieweePubkey, comment, rating)
        .accounts({ reviewer: provider.wallet.publicKey })
        .rpc();

      console.error(`Submitted: "${comment.slice(0, 40)}..." (rating=${rating}) → tx ${sig}`);
      results.push({
        pda: pda.toBase58(),
        reviewer: provider.wallet.publicKey.toBase58(),
        reviewee: revieweePubkey.toBase58(),
        rating,
        comment,
        tx: sig,
      });
    } catch (err) {
      console.error(`Failed to submit review: ${err instanceof Error ? err.message : err}`);
    }
  }

  // Print JSON to stdout for piping into eval/onchain_seed_data.json
  console.log(JSON.stringify(results, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
