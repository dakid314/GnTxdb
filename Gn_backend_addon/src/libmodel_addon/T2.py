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


def load_from_bert_aac(
    path: str,
    id_list: list,
    dim: int,
    len_: int = 100,
):
    def ac_code_from_logist(
        dim: int,
        arr: np.ndarray
    ):
        return np.array([
            "A", "B", "C"
        ][:dim])[np.argmax(arr, axis=-1)]
    result = ac_code_from_logist(dim, pickle.load(
        open(path, "rb"))['value'])[:, :len_]

    result = [
        libpybiofeature.AC.AAC(
            seq_aa="".join(item),
            aaorder=["A", "B", "C"][:dim]
        )
        for item in result
    ]

    return pd.DataFrame(result, index=id_list)


def load_from_bert_dac(
    path: str,
    id_list: list,
    dim: int,
    len_: int = 100,
):

    def ac_code_from_logist(
        dim: int,
        arr: np.ndarray
    ):
        return np.array([
            "A", "B", "C"
        ][:dim])[np.argmax(arr, axis=-1)]

    result = ac_code_from_logist(dim, pickle.load(
        open(path, "rb"))['value'])[:, :len_]

    result = [
        libpybiofeature.AC.DAC(
            seq_aa="".join(item),
            dacorder=libpybiofeature.AC._get_dac_order(
                aaorder=["A", "B", "C"][:dim]
            )
        )
        for item in result
    ]

    return pd.DataFrame(result, index=id_list)


def read_PC_data(
    path_to_csv: str,
    path_to_fasta: str,
):
    df = pd.read_csv(path_to_csv, index_col=None, header=None)
    df.index = [
        seq.id for seq in SeqIO.parse(path_to_fasta, "fasta")
    ]
    df.columns = list("ACDEFGHIKLMNPQRSTVWY") + [
        str(i) for i in range(1, (df.shape[1] - 20) + 1)
    ]
    return df


def load_feature(
    data_dir: str
):
    seq_id_list = [seq.id for seq in SeqIO.parse(
        f"{data_dir}/seq.fasta", "fasta")]

    feature_data_set = []

    # BPBaac
    BPBaac_seq_data = {
        "submit": libpybiofeature.libdataloader.fasta_seq_loader.prepare_data(
            path_to_fasta=f"{data_dir}/seq.fasta",
            seq_id_list=seq_id_list,
        )[0].values.tolist(),
    }
    with open(f"{os.environ['LIB_DIR']}/model/T2/BPBaac_profile.json", "r", encoding='UTF-8') as f:
        BPBaac_profile = json.load(f)
    for data_type in BPBaac_seq_data.keys():
        BPBaac_seq_data[data_type] = pd.DataFrame(
            [
                libpybiofeature.BPBaac_psp.mat_mapper(
                    seq=str(seq.seq),
                    pmat=BPBaac_profile['p'],
                    nmat=BPBaac_profile['n'],
                    cter=False,
                    terlength=100,
                    padding_ac='A'
                ) for seq in BPBaac_seq_data[data_type]
            ],
            index=seq_id_list
        )
    BPBaac_seq_data['name'] = "BPBaac"
    feature_data_set.append(BPBaac_seq_data)

    possum_index_dict = None
    with open(f"{data_dir}/possum_n.json", 'r', encoding='UTF-8') as f:
        possum_index_dict = json.load(f)

    feature_data_set.append({
        "name": "PSSM_feature",
        "submit": libpybiofeature.libdataloader.pssm_tools.get_all_pssm_feature(
            possum_index_list=possum_index_dict['data']['submited'],
            feature_name_list=['rpm_pssm', "d_fpssm", 'tpc', 's_fpssm'],
            path_to_fasta=f"{data_dir}/seq.fasta",
            path_to_with_pattern=f"{data_dir}/""{zipid}_pssm_features.zip"
        ).loc[seq_id_list, :],
    })

    # Expasy PP
    feature_data_set.append({
        "name": "Expasy_PP",
        "submit": libpybiofeature.libdataloader.expasy.get_expasy_t3sps(
            path_to_json=f"{data_dir}/expasy_n.json",
            seq_id_list=seq_id_list
        ),
    })

    feature_data_set.append({
        "name": "Top_n_gram",
        "submit": libpybiofeature.libdataloader.bliulab_new.Topm(
            path_to_Topm=f"{data_dir}/topn_data.json",
            seq_id_list=seq_id_list
        ),
    })

    feature_data_set.append({
        "name": "PCPseAAC",
        "submit": read_PC_data(
            path_to_csv=f"{data_dir}/PCPSE.csv",
            path_to_fasta=f"{data_dir}/seq.fasta",
        ),
    })

    feature_data_set.append({
        "name": "SS-100-AC",
        "submit": load_from_bert_aac(
            path=f"{data_dir}/ss_n.pkl",
            id_list=seq_id_list,
            dim=3
        ),
    })

    feature_data_set.append({
        "name": "DISO-100-DC",
        "submit": load_from_bert_dac(
            path=f"{data_dir}/diso_n.pkl",
            id_list=seq_id_list,
            dim=2
        ),
    })

    a45_set = {
        "name": "Similarity_BLOSUM45",
    }
    _, _, a45_set['submit'] = libpybiofeature.libdataloader.bliulab_new.build_form_of_data_set_align(
        path_to_align_result=f"{data_dir}/align_t2.json",
        seq_id_list=seq_id_list,
    )
    feature_data_set.append(a45_set)

    feature_data_set.append({
        "name": "CKSAAP",
        "submit": libpybiofeature.featurebuilder.build_CKSAAP_feature(
            path_to_fasta=f"{data_dir}/seq.fasta",
            seq_id_list=seq_id_list,
            desc='submit'
        ),
    })

    feature_data_set.append({
        "name": "QSO",
        "submit": libpybiofeature.featurebuilder.build_qso_feature(
            path_to_fasta=f"{data_dir}/seq.fasta",
            seq_id_list=seq_id_list,
            desc='submit',
            cter=False
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
    with open(f"{os.environ['LIB_DIR']}/model/T2/model_selected.json", "r", encoding="UTF-8") as f:
        model_selected_list = json.load(f)['model']
    threshold_dict = None
    with open(f"{os.environ['LIB_DIR']}/model/T2/threshold.json", "r", encoding="UTF-8") as f:
        threshold_dict = json.load(f)['threshold']

    with gzip.open(f"{os.environ['LIB_DIR']}/model/T2/model/scaler.pkl", "rb") as f:
        _scaler = pickle.load(f)

    result_dict = {}
    for model_name in model_selected_list:
        with gzip.open(f"{os.environ['LIB_DIR']}/model/T2/model/{model_name}.pkl", "rb", ) as f:
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
