import sys
sys.path.append("src")
import os
import pickle
import json
import gzip

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
    with open(f"{os.environ['LIB_DIR']}/model/T1/model_selected.json", "r", encoding="UTF-8") as f:
        model_selected_list = json.load(f)['model']
    threshold_dict = None
    with open(f"{os.environ['LIB_DIR']}/model/T1/threshold.json", "r", encoding="UTF-8") as f:
        threshold_dict = json.load(f)['threshold']

    with gzip.open(f"{os.environ['LIB_DIR']}/model/T1/model/scaler.pkl", "rb") as f:
        _scaler = pickle.load(f)

    result_dict = {}
    for model_name in model_selected_list:
        with gzip.open(f"{os.environ['LIB_DIR']}/model/T1/model/{model_name}.pkl", "rb", ) as f:
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
