import sys
sys.path.append("src")
import os
import pickle
import json
import gzip
import libexec
import libpybiofeature

import numpy as np
import pandas as pd
from Bio import SeqIO



def load_feature(
    data_dir: str
):
    seq_id_list = [seq.id for seq in SeqIO.parse(
        f"{data_dir}/seq.fasta", "fasta")]

    feature_data_set = []

    feature_data_set.append({
        "name": "AAC",
        "submit": libpybiofeature.featurebuilder.build_acc_feature(
            path_to_fasta=f"{data_dir}/seq.fasta",
            seq_id_list=seq_id_list,
            desc='submit'
        ),
    })

    feature_data_set.append({
        "name": "DAC",
        "submit": libpybiofeature.featurebuilder.build_dac_feature(
            path_to_fasta=f"{data_dir}/seq.fasta",
            seq_id_list=seq_id_list,
            desc='submit'
        ),
    })

    feature_data_set.append({
        "name": "TAC",
        "submit": libpybiofeature.featurebuilder.build_tac_feature(
            path_to_fasta=f"{data_dir}/seq.fasta",
            seq_id_list=seq_id_list,
            desc='submit'
        ),
    })
    
    feature_data_set.append({
        "name": "BPBaac",
        "submit": libexec.val_BPBaac.BPBaac(
            path_to_fasta=f"{data_dir}/seq.fasta",
            seq_id_list=seq_id_list,
        ),
    })

    feature_data_set.append({
        "name": "PPT_full",
        "submit": libpybiofeature.featurebuilder.build_PPT_feature(
            path_to_fasta=f"{data_dir}/seq.fasta",
            seq_id_list=seq_id_list,
            desc='submit',
            fulllong=True
        ),
    })

    feature_data_set.append({
        "name": "PPT_25",
        "submit": libpybiofeature.featurebuilder.build_PPT_feature(
            path_to_fasta=f"{data_dir}/seq.fasta",
            seq_id_list=seq_id_list,
            desc='submit'
        ),
    })

    feature_data_set.append({
        "name": "18PP",
        "submit": libpybiofeature.featurebuilder.build_etpp_feature(
            path_to_fasta=f"{data_dir}/seq.fasta",
            seq_id_list=seq_id_list,
            desc='submit'
        ),
    })

    feature_data_set.append({
        "name": "CTDD",
        "submit": libpybiofeature.featurebuilder.build_CTDD_feature(
            path_to_fasta=f"{data_dir}/seq.fasta",
            seq_id_list=seq_id_list,
            desc='submit'
        ),
    })

    feature_data_set.append({
        "name": "onehot",
        "submit": libpybiofeature.featurebuilder.build_oneHot_feature(
            path_to_fasta=f"{data_dir}/seq.fasta",
            seq_id_list=seq_id_list,
            length=100,
            desc='submit'
        ),
    })
    
    feature_data_set.append({
        "name": "QSO",
        "submit": libpybiofeature.featurebuilder.build_qso_feature(
            path_to_fasta=f"{data_dir}/seq.fasta",
            seq_id_list=seq_id_list,
            desc='submit'
        ),
    })
    
    feature_data_set.append({
        "name": "CTriad",
        "submit": libpybiofeature.featurebuilder.build_ctriad_feature(
            path_to_fasta=f"{data_dir}/seq.fasta",
            seq_id_list=seq_id_list,
            desc='submit'
        ),
    })
    
    
    feature_data_set.append({
        "name": "PC-PseAAC",
        "submit": libpybiofeature.featurebuilder.build_pc_pse_aac(
            path_to_fasta=f"{data_dir}/seq.fasta",
            seq_id_list=seq_id_list,
            data_dir=data_dir,
            desc='submit'
        ),
    })
    
    
    feature_data_set.append({
        "name": "SC-PseAAC",
        "submit": libpybiofeature.featurebuilder.build_sc_pse_aac(
            path_to_fasta=f"{data_dir}/seq.fasta",
            data_dir=data_dir,
            seq_id_list=seq_id_list,
            desc='submit'
        ),
    })
   

    data_set_split = {
        datatype: pd.concat([
            item[datatype] for item in feature_data_set
        ], axis=1)
        for datatype in ["submit",]
    }
    return data_set_split["submit"]


def runmodel(
    load_feature: pd.DataFrame,
):
    load_feature = load_feature.replace([np.inf, -np.inf, np.nan], 0.0)
    model_selected_list = None
    with open(f"{os.environ['LIB_DIR']}/model/T6/model_selected.json", "r", encoding="UTF-8") as f:
        model_selected_list = json.load(f)['model']
    threshold_dict = None
    with open(f"{os.environ['LIB_DIR']}/model/T3/threshold.json", "r", encoding="UTF-8") as f:
        threshold_dict = json.load(f)['threshold']

    with gzip.open(f"{os.environ['LIB_DIR']}/model/T3/model/scaler.pkl", "rb") as f:
        _scaler = pickle.load(f)

    result_dict = {}
    for model_name in model_selected_list:
        with gzip.open(f"{os.environ['LIB_DIR']}/model/T3/model/{model_name}.pkl", "rb", ) as f:
            model = pickle.load(f)

        result_dict[model_name] = (
            np.nan_to_num(model.predict_proba(
                X=_scaler.transform(load_feature.values)
            ), nan=0.0)[:, 1] >= threshold_dict[model_name]
        ).astype(int)

    # Voting
    return np.stack([
        result_dict[model_name] for model_name in model_selected_list
    ], axis=1).mean(axis=1)
