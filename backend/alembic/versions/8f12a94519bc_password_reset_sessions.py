"""password_reset_sessions

Revision ID: 8f12a94519bc
Revises: 7dc31a5048b6
Create Date: 2026-10-04 19:30:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '8f12a94519bc'
down_revision = '7dc31a5048b6'
branch_labels = None
depends_on = None

def upgrade() -> None:
    inspector = sa.inspect(op.get_bind())
    # Idempotent: existing dev databases already have this table (created by the old startup create_all),
    # and on an empty database "users" does not exist yet — the baseline revision b7e4c1d9a0f2 creates it.
    if inspector.has_table('password_reset_sessions') or not inspector.has_table('users'):
        return
    op.create_table(
        'password_reset_sessions',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('email_fingerprint', sa.String(length=64), nullable=False),
        sa.Column('otp_digest', sa.String(length=255), nullable=True),
        sa.Column('otp_expires_at', sa.DateTime(), nullable=True),
        sa.Column('resend_available_at', sa.DateTime(), nullable=True),
        sa.Column('attempts_used', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('send_count', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='pending'),
        sa.Column('client_ip', sa.String(length=50), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Column('used_at', sa.DateTime(), nullable=True),
        sa.Column('locked_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_password_reset_sessions_email_fingerprint'), 'password_reset_sessions', ['email_fingerprint'], unique=False)
    op.create_index(op.f('ix_password_reset_sessions_user_id'), 'password_reset_sessions', ['user_id'], unique=False)
    op.create_index('idx_pwd_reset_fingerprint_status', 'password_reset_sessions', ['email_fingerprint', 'status'], unique=False)
    op.create_index('idx_pwd_reset_ip_created', 'password_reset_sessions', ['client_ip', 'created_at'], unique=False)

def downgrade() -> None:
    op.drop_index('idx_pwd_reset_ip_created', table_name='password_reset_sessions')
    op.drop_index('idx_pwd_reset_fingerprint_status', table_name='password_reset_sessions')
    op.drop_index(op.f('ix_password_reset_sessions_user_id'), table_name='password_reset_sessions')
    op.drop_index(op.f('ix_password_reset_sessions_email_fingerprint'), table_name='password_reset_sessions')
    op.drop_table('password_reset_sessions')
