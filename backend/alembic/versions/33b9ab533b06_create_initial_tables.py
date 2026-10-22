"""create_initial_tables

Revision ID: 33b9ab533b06
Revises: 
Create Date: 2026-10-22 20:32:07.501564

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = '33b9ab533b06'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. posyandu
    op.create_table(
        'posyandu',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('nama', sa.String(length=200), nullable=False),
        sa.Column('desa', sa.String(length=200), nullable=True),
        sa.Column('kecamatan', sa.String(length=200), nullable=True),
        sa.Column('kabupaten', sa.String(length=200), nullable=True),
        sa.Column('provinsi', sa.String(length=200), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    )

    # 2. kader
    op.create_table(
        'kader',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('posyandu_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('posyandu.id', ondelete='CASCADE'), nullable=False),
        sa.Column('nama', sa.String(length=200), nullable=False),
        sa.Column('email', sa.String(length=200), unique=True, nullable=True),
        sa.Column('phone', sa.String(length=20), nullable=True),
        sa.Column('role', sa.String(length=50), server_default='kader', nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    )

    # 3. balita
    op.create_table(
        'balita',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('posyandu_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('posyandu.id', ondelete='CASCADE'), nullable=False),
        sa.Column('nama', sa.String(length=200), nullable=False),
        sa.Column('tanggal_lahir', sa.Date(), nullable=False),
        sa.Column('jenis_kelamin', sa.String(length=10), nullable=False),
        sa.Column('nama_ibu', sa.String(length=200), nullable=True),
        sa.Column('alamat', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    )

    # 4. penimbangan
    op.create_table(
        'penimbangan',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('balita_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('balita.id', ondelete='CASCADE'), nullable=False),
        sa.Column('kader_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('kader.id', ondelete='SET NULL'), nullable=True),
        sa.Column('tanggal_timbang', sa.Date(), nullable=False),
        sa.Column('umur_bulan', sa.Integer(), nullable=False),
        sa.Column('berat_kg', sa.Numeric(precision=5, scale=2), nullable=False),
        sa.Column('tinggi_cm', sa.Numeric(precision=5, scale=1), nullable=False),
        sa.Column('zscore_bbu', sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column('zscore_pbu', sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column('zscore_bbpb', sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column('status_gizi', sa.String(length=50), nullable=True),
        sa.Column('input_mode', sa.String(length=20), server_default='form', nullable=True),
        sa.Column('foto_url', sa.Text(), nullable=True),
        sa.Column('rekomendasi_gizi', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    )


def downgrade() -> None:
    op.drop_table('penimbangan')
    op.drop_table('balita')
    op.drop_table('kader')
    op.drop_table('posyandu')
