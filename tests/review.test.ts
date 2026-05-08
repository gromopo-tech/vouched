import * as anchor from '@coral-xyz/anchor'
import { Program } from '@coral-xyz/anchor'
import { Review } from '../target/types/review'

describe('review', () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env()
  anchor.setProvider(provider)
  const program = anchor.workspace.Review as Program<Review>

  const review = {
    reviewee: anchor.web3.Keypair.generate().publicKey, // no signer needed now
    comment: "Wow what a good sandwich it was real great",
    rating: 5,
  };

  const [reviewPda] = anchor.web3.PublicKey.findProgramAddressSync(
    [review.reviewee.toBuffer(), provider.wallet.publicKey.toBuffer()],
    program.programId
  );

  it('Add Review', async () => {
    await program.methods
      .addReview(review.reviewee, review.comment, review.rating)
      .accounts({
        reviewer: provider.wallet.publicKey,
      })
      .rpc();

    const account = await program.account.review.fetch(reviewPda);
    expect(account.rating).toEqual(review.rating);
    expect(account.comment).toEqual(review.comment);
    expect(account.reviewer.toString()).toEqual(provider.wallet.publicKey.toString());
  })

  it('Update review', async () => {
    const newDescription = "Wow this is new";
    const newRating = 4;

    await program.methods
      .updateReview(review.reviewee, newDescription, newRating)
      .accounts({
        reviewer: provider.wallet.publicKey,
      })
      .rpc();

    const account = await program.account.review.fetch(reviewPda);
    expect(account.rating).toEqual(newRating);
    expect(account.comment).toEqual(newDescription);
  });

  it('Delete the review and close the review account', async () => {
    await program.methods
      .deleteReview(review.reviewee)
      .accounts({
        reviewer: provider.wallet.publicKey,
      })
      .rpc();

    // The account should no longer exist, returning null.
    const userAccount = await program.account.review.fetchNullable(reviewPda);
    expect(userAccount).toBeNull();
  });
})
