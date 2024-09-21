import csv
from Bio import SeqIO
import sys
from Bio.Seq import Seq
sys.path.append("../libpybiofeature/")
from libpybiofeature import BPBaac_psp
import csv
import pandas as pd

pos_file = './lib/data/T3/pos.fasta'
neg_file = './lib/data/T3/neg.fasta'
def BPBaac(path_to_fasta,seq_id_list):
    # 读取FASTA文件
    pos_fasta_sequences = list(SeqIO.parse(pos_file, "fasta"))
    neg_fasta_sequences = list(SeqIO.parse(neg_file, "fasta"))
    val_fasta = list(SeqIO.parse(path_to_fasta, "fasta"))
    
    pmat = BPBaac_psp.mat_constructor(pos_fasta_sequences, cter=True)

    nmat = BPBaac_psp.mat_constructor(neg_fasta_sequences, cter=True)

   
    df = pd.DataFrame([
        BPBaac_psp.mat_mapper(
            seq_record, pmat, nmat, cter=False
            )for seq_record in val_fasta
    ])
    df.index = [seq.id for seq in val_fasta]        
    return df.loc[seq_id_list, :]

