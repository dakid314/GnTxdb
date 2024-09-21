from Bio.Blast.Applications import NcbiblastpCommandline
from Bio import SeqIO
import os
from Bio import SearchIO
import numpy as np
def blast(prottype,data_dir):
    # 执行blast比对
    output_file = f"{data_dir}/{prottype}.xml"
    blastp_cline = NcbiblastpCommandline(cmd='blastp', query=f"{data_dir}/seq.fasta", subject=f"{os.environ['LIB_DIR']}/data/T{prottype}SE.fasta", outfmt=5, out=output_file)
    blastp_cline()
    
    seq_id = []  # 存储经筛选后的阴性蛋白质序列

    from Bio.Blast import NCBIXML
    blast_results = NCBIXML.parse(open(output_file))
    for result in blast_results:
        for alignment in result.alignments:
            for hsp in alignment.hsps:
                if hsp.identities / alignment.length >= 0.3 and hsp.align_length / alignment.length >= 0.7:
                    seq_id.append(alignment.title.split()[0])
    return seq_id

def output(prottype,data_dir):
    seq_id_list = [seq.id for seq in SeqIO.parse(
        f"{data_dir}/seq.fasta", "fasta")]
    pos_id = blast(prottype,data_dir)
    out = []
    for a in seq_id_list:
        if a in pos_id:
            out.append(1)
        else:
            out.append(0)
    seq_out_dict = dict(zip(seq_id_list, out))
    return np.array(seq_out_dict)
    
    