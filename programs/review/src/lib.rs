#![allow(clippy::result_large_err)]
#![allow(unexpected_cfgs)]

use anchor_lang::prelude::*;

pub mod constants;

pub use constants::*;

declare_id!("A1sSsTDoDrBkJ96fuHo9G89gHsEXVvcW6tNV39AfyWbF");

#[program]
pub mod review {
    use super::*;

    pub fn add_review(
        ctx: Context<AddReview>,
        reviewee: Pubkey,
        comment: String,
        rating: u8
    ) -> Result<()> {
        // We require that the rating is between 1 and 5
        require!(
            rating >= MIN_RATING && rating <= MAX_RATING,
            ReviewError::InvalidRating
        );
     
        // We require that the comment is not longer than 2500 characters
        require!(
            comment.len() <= MAX_COMMENT_LENGTH,
            ReviewError::CommentTooLong
        );
        msg!("Review account created");
        msg!("Reviewee: {}", reviewee);
        msg!("Comment: {}", comment);
        msg!("Rating: {}", rating);

        let review = &mut ctx.accounts.review;
        review.reviewer = ctx.accounts.reviewer.key();
        review.reviewee = reviewee;
        review.rating = rating;
        review.comment = comment;
        Ok(())
    }

    pub fn update_review(
        ctx: Context<UpdateReview>,
        reviewee: Pubkey,
        comment: String,
        rating: u8
    ) -> Result<()> {
        // We require that the rating is between 1 and 5
        require!(
            rating >= MIN_RATING && rating <= MAX_RATING,
            ReviewError::InvalidRating
        );
     
        // We require that the comment is not longer than 50 characters
        require!(
            comment.len() <= MAX_COMMENT_LENGTH,
            ReviewError::CommentTooLong
        );
     
        msg!(" review account space reallocated");
        msg!("Reviewee: {}", reviewee);
        msg!("Comment: {}", comment);
        msg!("Rating: {}", rating);
     
        let review = &mut ctx.accounts.review;
        review.comment = comment;
        review.rating = rating;
        Ok(())
    }
    pub fn delete_review(_ctx: Context<DeleteReview>, reviewee: Pubkey) -> Result<()> {
        msg!(" review for {} deleted", reviewee);
        Ok(())
    }
}

#[account]
pub struct Review {
    pub reviewer: Pubkey,
    pub reviewee: Pubkey,
    pub rating: u8,
    pub comment: String,
}

impl Space for Review {
    const INIT_SPACE: usize = 
      ANCHOR_DISCRIMINATOR + 
      PUBKEY_SIZE + 
      PUBKEY_SIZE + 
      U8_SIZE + 
      STRING_LENGTH_PREFIX;
}

#[derive(Accounts)]
#[instruction(reviewee: Pubkey, comment: String)]
pub struct AddReview<'info> {
    #[account(
        init,
        seeds = [reviewee.as_ref(), reviewer.key().as_ref()],
        bump,
        payer = reviewer,
        space = Review::INIT_SPACE + comment.len()
    )]
    pub review: Account<'info, Review>,
    #[account(mut)]
    pub reviewer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(reviewee: Pubkey, comment: String, rating: u8)]
pub struct UpdateReview<'info> {
    #[account(
        mut,
        seeds = [reviewee.as_ref(), reviewer.key().as_ref()],
        bump,
        realloc = Review::INIT_SPACE + comment.len(),
        realloc::payer = reviewer,
        realloc::zero = false,
    )]
    pub review: Account<'info, Review>,
    #[account(mut)]
    pub reviewer: Signer<'info>,
    pub system_program: Program<'info, System>
}

#[derive(Accounts)]
#[instruction(reviewee: Pubkey)]
pub struct DeleteReview<'info> {
    #[account(
        mut,
        seeds = [reviewee.as_ref(), reviewer.key().as_ref()],
        bump,
        close = reviewer
    )]
    pub review: Account<'info, Review>,
    #[account(mut)]
    pub reviewer: Signer<'info>,
    pub system_program: Program<'info, System>
}

#[error_code]
enum ReviewError {
    #[msg("Rating must be between 1 and 5")]
    InvalidRating,
    #[msg(" Comment too long")]
    CommentTooLong,
}