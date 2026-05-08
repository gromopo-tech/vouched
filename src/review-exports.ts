// Here we export some useful types and functions for interacting with the Anchor program.
import { AnchorProvider, Program } from '@coral-xyz/anchor'
import { Cluster, PublicKey } from '@solana/web3.js'
import ReviewIDL from '../target/idl/review.json'
import type { Review } from '../target/types/review'

// Re-export the generated IDL and type
export { Review, ReviewIDL }

// The programId is imported from the program IDL.
export const REVIEW_PROGRAM_ID = new PublicKey(ReviewIDL.address)

// This is a helper function to get the Review Anchor program.
export function getReviewProgram(provider: AnchorProvider, address?: PublicKey): Program<Review> {
  return new Program({ ...ReviewIDL, address: address ? address.toBase58() : ReviewIDL.address } as Review, provider)
}

// This is a helper function to get the program ID for the Review depending on the cluster.
export function getReviewProgramId(cluster: Cluster) {
  switch (cluster) {
    case 'devnet':
      return new PublicKey('A1sSsTDoDrBkJ96fuHo9G89gHsEXVvcW6tNV39AfyWbF')
    case 'testnet':
    case 'mainnet-beta':
    default:
      return REVIEW_PROGRAM_ID
  }
}
