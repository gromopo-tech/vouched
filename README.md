# Vouched

## Part of the Gromopo System

Vouched is the on-chain review layer for [Gromopo](https://github.com/gromopo-tech/gromopo), a Solana-based restaurant ordering platform. After a customer completes a USDC payment through Gromopo, they are prompted to leave a review via this Anchor program. Reviews are purchase-verified — the reviewer must use the same wallet they paid with. Reviews are stored on-chain as PDA accounts (one per wallet per restaurant), then periodically indexed by an off-chain Python service ([gromopo-tech/chat](https://github.com/gromopo-tech/chat)) using `solders` + manual Borsh deserialization — deserializing account state and upserting into a Qdrant vector store so restaurant owners can query their review data through an AI-powered chat interface.

```mermaid
flowchart LR
    A([Customer\npost-order]) -->|addReview tx| B[Vouched\nAnchor program\nSolana devnet]
    B -->|getProgramAccounts\n+ manual Borsh decode| C[OnChainReviewSource\ngromopo-tech/chat]
    C -->|Vertex AI\ntext-embedding-004| D[(Qdrant\nvector store)]
    D -->|semantic search\n+ LLM filter extraction| E[FastAPI RAG service\ngromopo-tech/chat]
    E -->|streamed response| F([Owner dashboard\nAI review chat])
```

**Program ID:** `A1sSsTDoDrBkJ96fuHo9G89gHsEXVvcW6tNV39AfyWbF` (Solana devnet)

**Related repos:**
- [gromopo-tech/gromopo](https://github.com/gromopo-tech/gromopo) — Next.js ordering platform (calls this program post-order)
- [gromopo-tech/chat](https://github.com/gromopo-tech/chat) — RAG service that indexes these on-chain reviews

---

## Getting Started

### Prerequisites

- [Rust](https://www.rust-lang.org/tools/install)
- [Solana CLI](https://docs.solanalabs.com/cli/install)
- [Anchor CLI](https://www.anchor-lang.com/docs/installation)
- Node.js 20+ and yarn

### Install dependencies

```shell
yarn install
```

## Commands

#### Build the program

```shell
yarn anchor-build
```

#### Start the local test validator with the program deployed

```shell
yarn anchor-localnet
```

#### Run the tests

```shell
yarn anchor-test
```

#### Deploy to Devnet

```shell
yarn anchor-deploy
```

#### Sync the program ID (after redeploying)

If you generate a new keypair, update the program ID in `Anchor.toml`, `programs/review/src/lib.rs` (`declare_id!`), and `src/review-exports.ts`.

```shell
anchor keys sync
```
