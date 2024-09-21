import sys
sys.path.append("src")
import os
import pickle
import json
import subprocess
import numpy as np
import pandas as pd

from Bio import SeqIO


def load_feature(
    data_dir: str
):
    cter = False
    path_to_fasta = f"{data_dir}/seq.fasta"
    commands = [
        f"python3 -u /mnt/md0/Public/一站式/txseml_backend_addon/txseml_addon/src/libexec/18pp.py -i {path_to_fasta} -o {data_dir}/18pp.csv",
        f"python3 -u /mnt/md0/Public/一站式/txseml_backend_addon/txseml_addon/src/libexec/DPC.py -i {path_to_fasta} -o {data_dir}/DPC.csv ",
        f"python3 -u /mnt/md0/Public/一站式/txseml_backend_addon/txseml_addon/src/libexec/val_BPBaac.py -v {path_to_fasta} -o {data_dir}/BPBaac.csv -n /mnt/md0/Public/一站式/txseml_backend_addon/lib/data/T3/neg.fasta -p /mnt/md0/Public/一站式/txseml_backend_addon/lib/data/T3/pos.fasta -c {cter}",
        f"python3 -u /mnt/md0/Public/一站式/txseml_backend_addon/txseml_addon/src/libexec/CTDC.py -i {path_to_fasta} -o {data_dir}/CTDC.csv ",
        f"python3 -u /mnt/md0/Public/一站式/txseml_backend_addon/txseml_addon/src/libexec/CTDD.py -i {path_to_fasta} -o {data_dir}/CTDD.csv ",
        f"python3 -u /mnt/md0/Public/一站式/txseml_backend_addon/txseml_addon/src/libexec/CTDT.py -i {path_to_fasta} -o {data_dir}/CTDT.csv ",

        f"python3 -u /mnt/md0/Public/一站式/txseml_backend_addon/txseml_addon/src/libexec/ctriad.py -i {path_to_fasta} -o {data_dir}/CTriad.csv ",
        f"python3 -u /mnt/md0/Public/一站式/txseml_backend_addon/txseml_addon/src/libexec/onehot.py -i {path_to_fasta} -o {data_dir}/onehot.csv -c {cter}",
        f"python3 -u /mnt/md0/Public/一站式/txseml_backend_addon/txseml_addon/src/libexec/ppt.py -i {path_to_fasta} -o {data_dir}/ppt.csv ",
        f"python3 -u /mnt/md0/Public/一站式/txseml_backend_addon/txseml_addon/src/libexec/ppt25.py -i {path_to_fasta} -o {data_dir}/ppt25.csv -c {cter}",
        f"python3 -u /mnt/md0/Tools/PseinOne/src {path_to_fasta} {data_dir}/SC-PseAAC.csv Protein SC-PseAAC -f csv -lamada 1 -w 0.5",
        f"python3 -u /mnt/md0/Tools/PseinOne/src {path_to_fasta} {data_dir}/PC-PseAAC.csv Protein PC-PseAAC -f csv -lamada 1 -w 0.5",

        f"python3 -u /mnt/md0/Public/一站式/txseml_backend_addon/txseml_addon/src/libexec/qso.py -i {path_to_fasta} -o {data_dir}/QSO.csv ",
        f"python3 -u /mnt/md0/Public/一站式/txseml_backend_addon/txseml_addon/src/libexec/AAC.py -i {path_to_fasta} -o {data_dir}/AAC.csv ",
        f"python3 -u /mnt/md0/Public/一站式/txseml_backend_addon/txseml_addon/src/libexec/TAC.py -i {path_to_fasta} -o {data_dir}/TAC.csv ",
    ]
    for command in commands:
        subprocess.run(command,shell=True)


def runmodel(
    data_dir:str,
    
):
    path_to_fasta = f"{data_dir}/seq.fasta"
    seq_id_list = []
    for record in SeqIO.parse(f'{path_to_fasta}', "fasta"):
        seq_id_list.append(record.id)
    feature_data_set = []
    model_list = ["XGBClassifier", "GaussianNB", "GradientBoostingClassifier",   
                                    "SVC","KNeighborsClassifier", 
                                    "RandomForestClassifier"]
    feature_list = ['18pp','AAC','BPBaac','CTDC','CTDT','CTriad','onehot',
                'PC-PseAAC','ppt25','QSO','SC-PseAAC','CTDD','DPC']
    rate = '1_100'
    
    for model_name in model_list:
        for feature_name in feature_list: 
            tmp_result_dict = {}
            a = 0
            while a < 5: 
                model_save_dir = f"{os.environ['LIB_DIR']}/model/T3/{feature_name}/{rate}/{a}"
                if feature_name in ['PC-PseAAC','SC-PseAAC']:
                    val_df = pd.read_csv(f'{data_dir}/{feature_name}.csv',header=None)
                else:
                    val_df = pd.read_csv(f'{data_dir}/{feature_name}.csv')
                if feature_name in ['SC-PseAAC', 'PC-PseAAC']:
                    val_df1 = val_df.iloc[0:, 0:]
                else:
                    val_df1 = val_df.iloc[0:, 1:]
                
                feature = pd.DataFrame(val_df1)
                if feature_name == 'CTriad':
                    feature_ = np.array([eval(row) for row in feature['CTriad']])
                else:
                    feature_ = feature.astype("float").values
                
                model = pickle.load(open(f"{model_save_dir}/{model_name}.pkl", "br"))
                
                tmp_result_dict[a] = model.predict_proba(feature_)[:, 1] 
                a+=1
            tmp = np.stack([
                    tmp_result_dict[a] for a in [0,1,2,3,4]
                ], axis=1).mean(axis=1)
            pred = pd.DataFrame(tmp)
            feature_data_set.append({
                "name": f"{model}_{feature_name}",
                "submit": pred,
            })
         
            
    data_set_split = {
        datatype: pd.concat([
            item[datatype] for item in feature_data_set
        ], axis=1)
        for datatype in ["submit",]
    }
    data = pd.DataFrame(data_set_split["submit"])
    data.insert(0, "protein_id", seq_id_list)
    data.to_csv(f'{data_dir}/feature.csv',index=False)
    
    
    
    #voting
    
    
    voting_model_save_dir = f"{os.environ['LIB_DIR']}/model/T3/voting_model"

    df = pd.read_csv(f'{data_dir}/feature.csv',header=None)
    feature = df.iloc[1:,1:]
    feature_ = feature.astype("float").values
    
    result_dict = {}
    for model_name in model_list:
    
        model = pickle.load(open(f"{voting_model_save_dir}/{model_name}.pkl", "br"))
        
        with open(f"{voting_model_save_dir}/threshold.json", "r", encoding="UTF-8") as f:
            threshold_dict = json.load(f)
        
        result_dict[model_name] = (
        np.nan_to_num(model.predict_proba(feature_), nan=0.0)[:, 1] >= threshold_dict[model_name]
        ).astype(int)
        
    return np.stack([
                        result_dict[model_name1] for model_name1 in model_list
                    ], axis=1).mean(axis=1)
    
    
        
            
            
            

    
