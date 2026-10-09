use crate::program::JointVenture;
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, TransferChecked};

declare_id!("Ezssvc6b1pDYT387dBUn95Lac429GQsSz7FHNEHqBcwJ");

#[program]
pub mod joint_venture {
    use super::*;

    pub fn initialize_bavaria(ctx: Context<InitializeBavaria>) -> Result<()> {
        let project = &mut ctx.accounts.project;
        project.version = 1;
        project.bump = ctx.bumps.project;
        project.vault_bump = ctx.bumps.vault;
        project.authority = ctx.accounts.authority.key();
        project.accepted_mint = ctx.accounts.mint.key();
        project.slug = "bavaria".to_owned();
        project.name = "Bavaria Cultivation Facility".to_owned();
        project.target_eur_cents = 25_000_000;
        project.infrastructure_eur_cents = 22_000_000;
        project.contracted_monthly_revenue_eur_cents = 3_300_000;
        project.total_financed_units = 0;
        project.financing_enabled = false;
        Ok(())
    }

    pub fn set_financing_enabled(ctx: Context<SetFinancingEnabled>, enabled: bool) -> Result<()> {
        ctx.accounts.project.financing_enabled = enabled;
        Ok(())
    }

    pub fn finance(ctx: Context<Finance>, amount: u64, expected_nonce: u64) -> Result<()> {
        require!(
            ctx.accounts.project.financing_enabled,
            ProjectError::FinancingDisabled
        );
        require!(amount > 0, ProjectError::InvalidAmount);
        let position = &mut ctx.accounts.position;
        // No close/reset instruction exists. A zero project marks a newly created position.
        if position.project == Pubkey::default() {
            position.project = ctx.accounts.project.key();
            position.investor = ctx.accounts.investor.key();
            position.bump = ctx.bumps.position;
        }
        require_keys_eq!(
            position.project,
            ctx.accounts.project.key(),
            ProjectError::WrongPosition
        );
        require_keys_eq!(
            position.investor,
            ctx.accounts.investor.key(),
            ProjectError::WrongPosition
        );
        require!(
            expected_nonce == position.next_nonce,
            ProjectError::StaleNonce
        );
        let contribution = position
            .contributed_units
            .checked_add(amount)
            .ok_or(ProjectError::Overflow)?;
        let nonce = position
            .next_nonce
            .checked_add(1)
            .ok_or(ProjectError::Overflow)?;
        let total = ctx
            .accounts
            .project
            .total_financed_units
            .checked_add(amount)
            .ok_or(ProjectError::Overflow)?;
        token::transfer_checked(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                TransferChecked {
                    from: ctx.accounts.source.to_account_info(),
                    mint: ctx.accounts.mint.to_account_info(),
                    to: ctx.accounts.vault.to_account_info(),
                    authority: ctx.accounts.investor.to_account_info(),
                },
            ),
            amount,
            6,
        )?;
        position.contributed_units = contribution;
        position.next_nonce = nonce;
        ctx.accounts.project.total_financed_units = total;
        emit!(FinancingRecorded {
            project: ctx.accounts.project.key(),
            investor: ctx.accounts.investor.key(),
            amount,
            nonce: expected_nonce
        });
        Ok(())
    }

    pub fn record_document(
        ctx: Context<RecordDocument>,
        document_id: String,
        document_name: String,
        sha256_hash: Vec<u8>,
    ) -> Result<()> {
        require!(
            !document_name.trim().is_empty() && document_name.len() <= 64,
            DocumentError::InvalidName
        );
        require!(sha256_hash.len() == 32, DocumentError::InvalidHashLength);
        let record = &mut ctx.accounts.document_record;
        record.project = ctx.accounts.project.key();
        record.authority = ctx.accounts.authority.key();
        record.document_id = document_id;
        record.document_name = document_name;
        record.sha256_hash = sha256_hash
            .try_into()
            .map_err(|_| DocumentError::InvalidHashLength)?;
        record.created_at = Clock::get()?.unix_timestamp;
        record.bump = ctx.bumps.document_record;
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(document_id: String)]
pub struct RecordDocument<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        seeds = [b"project", b"bavaria"], bump = project.bump,
        has_one = authority @ DocumentError::Unauthorized,
        constraint = !document_id.is_empty() && document_id.len() <= 32
            && document_id.bytes().all(|c| c.is_ascii_lowercase() || c.is_ascii_digit() || c == b'-')
            @ DocumentError::InvalidId
    )]
    pub project: Account<'info, Project>,
    #[account(init, payer = authority, space = 8 + DocumentRecord::INIT_SPACE,
        seeds = [b"document", project.key().as_ref(), document_id.as_bytes()], bump)]
    pub document_record: Account<'info, DocumentRecord>,
    pub system_program: Program<'info, System>,
}

#[account]
#[derive(InitSpace)]
pub struct DocumentRecord {
    pub project: Pubkey,
    pub authority: Pubkey,
    #[max_len(32)]
    pub document_id: String,
    #[max_len(64)]
    pub document_name: String,
    pub sha256_hash: [u8; 32],
    pub created_at: i64,
    pub bump: u8,
}

#[error_code(offset = 6100)]
pub enum DocumentError {
    #[msg("Only the project authority can record a document fingerprint.")]
    Unauthorized,
    #[msg("Use a document ID of 1–32 lowercase ASCII letters, digits or hyphens.")]
    InvalidId,
    #[msg("Use a non-empty document name of at most 64 UTF-8 bytes.")]
    InvalidName,
    #[msg("The SHA-256 fingerprint must contain exactly 32 bytes.")]
    InvalidHashLength,
}

#[derive(Accounts)]
pub struct SetFinancingEnabled<'info> {
    pub authority: Signer<'info>,
    #[account(mut, seeds = [b"project", b"bavaria"], bump = project.bump, has_one = authority @ ProjectError::Unauthorized)]
    pub project: Account<'info, Project>,
}

#[derive(Accounts)]
pub struct Finance<'info> {
    #[account(mut)]
    pub investor: Signer<'info>,
    #[account(mut, seeds = [b"project", b"bavaria"], bump = project.bump)]
    pub project: Account<'info, Project>,
    #[account(address = project.accepted_mint, constraint = mint.decimals == 6 @ ProjectError::WrongDecimals)]
    pub mint: Account<'info, Mint>,
    #[account(mut, seeds = [b"vault", project.key().as_ref()], bump = project.vault_bump, token::mint = mint, token::authority = project)]
    pub vault: Account<'info, TokenAccount>,
    #[account(mut, token::mint = mint, token::authority = investor)]
    pub source: Account<'info, TokenAccount>,
    #[account(init_if_needed, payer = investor, space = 8 + Position::INIT_SPACE, seeds = [b"position", project.key().as_ref(), investor.key().as_ref()], bump)]
    pub position: Account<'info, Position>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[account]
#[derive(InitSpace)]
pub struct Position {
    pub project: Pubkey,
    pub investor: Pubkey,
    pub contributed_units: u64,
    pub next_nonce: u64,
    pub bump: u8,
}

#[event]
pub struct FinancingRecorded {
    pub project: Pubkey,
    pub investor: Pubkey,
    pub amount: u64,
    pub nonce: u64,
}

#[derive(Accounts)]
pub struct InitializeBavaria<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(constraint = program_account.programdata_address()? == Some(program_data.key()) @ ProjectError::Unauthorized)]
    pub program_account: Program<'info, JointVenture>,
    #[account(constraint = program_data.upgrade_authority_address == Some(authority.key()) @ ProjectError::Unauthorized)]
    pub program_data: Account<'info, ProgramData>,
    #[account(init, payer = authority, space = 8 + Project::INIT_SPACE, seeds = [b"project", b"bavaria"], bump)]
    pub project: Account<'info, Project>,
    #[account(constraint = mint.decimals == 6 @ ProjectError::WrongDecimals)]
    pub mint: Account<'info, Mint>,
    #[account(init, payer = authority, seeds = [b"vault", project.key().as_ref()], bump, token::mint = mint, token::authority = project)]
    pub vault: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[account]
#[derive(InitSpace)]
pub struct Project {
    pub version: u8,
    pub bump: u8,
    pub vault_bump: u8,
    pub authority: Pubkey,
    pub accepted_mint: Pubkey,
    #[max_len(7)]
    pub slug: String,
    #[max_len(80)]
    pub name: String,
    pub target_eur_cents: u64,
    pub infrastructure_eur_cents: u64,
    pub contracted_monthly_revenue_eur_cents: u64,
    pub total_financed_units: u64,
    pub financing_enabled: bool,
}

#[error_code]
pub enum ProjectError {
    #[msg("Only the deployed program's upgrade authority can initialize the Bavaria project.")]
    Unauthorized,
    #[msg("The project accepts a classic SPL test-token mint with exactly six decimals.")]
    WrongDecimals,
    #[msg("Project financing is paused.")]
    FinancingDisabled,
    #[msg("Enter a positive token amount.")]
    InvalidAmount,
    #[msg("This financing attempt has already been recorded or the position has changed. Refresh before a new commitment.")]
    StaleNonce,
    #[msg("The position must belong to this project and investor.")]
    WrongPosition,
    #[msg("The amount exceeds the supported range.")]
    Overflow,
}
