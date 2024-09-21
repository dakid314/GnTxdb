import sys
sys.path.append("src")
import os
import pickle
import json
import subprocess
import numpy as np
import pandas as pd




def load_feature(
    data_dir: str
):
    cter = False
    path_to_fasta = f"{data_dir}/seq.fasta"
    commands = [
        f"python3 -u /mnt/md0/Public/一站式/txseml_backend_addon/txseml_addon/src/libexec/18pp.py -i {path_to_fasta} -o {data_dir}/T5_18pp.csv",
        f"python3 -u /mnt/md0/Public/一站式/txseml_backend_addon/txseml_addon/src/libexec/DPC.py -i {path_to_fasta} -o {data_dir}/T5_DPC.csv ",
        f"python3 -u /mnt/md0/Public/一站式/txseml_backend_addon/txseml_addon/src/libexec/val_BPBaac.py -v {path_to_fasta} -o {data_dir}/T5_BPBaac.csv -n /mnt/md0/Public/一站式/txseml_backend_addon/lib/data/T5/neg.fasta -p /mnt/md0/Public/一站式/txseml_backend_addon/lib/data/T5/pos.fasta -c {cter}",
        f"python3 -u /mnt/md0/Public/一站式/txseml_backend_addon/txseml_addon/src/libexec/CTDC.py -i {path_to_fasta} -o {data_dir}/T5_CTDC.csv ",
        f"python3 -u /mnt/md0/Public/一站式/txseml_backend_addon/txseml_addon/src/libexec/CTDD.py -i {path_to_fasta} -o {data_dir}/T5_CTDD.csv ",
        f"python3 -u /mnt/md0/Public/一站式/txseml_backend_addon/txseml_addon/src/libexec/CTDT.py -i {path_to_fasta} -o {data_dir}/T5_CTDT.csv ",

        f"python3 -u /mnt/md0/Public/一站式/txseml_backend_addon/txseml_addon/src/libexec/ctriad.py -i {path_to_fasta} -o {data_dir}/T5_CTriad.csv ",
        f"python3 -u /mnt/md0/Public/一站式/txseml_backend_addon/txseml_addon/src/libexec/onehot.py -i {path_to_fasta} -o {data_dir}/T5_onehot.csv -c {cter}",
        f"python3 -u /mnt/md0/Public/一站式/txseml_backend_addon/txseml_addon/src/libexec/ppt.py -i {path_to_fasta} -o {data_dir}/T5_ppt.csv ",
        f"python3 -u /mnt/md0/Public/一站式/txseml_backend_addon/txseml_addon/src/libexec/ppt25.py -i {path_to_fasta} -o {data_dir}/T5_ppt25.csv -c {cter}",
        f"python3 -u /mnt/md0/Tools/PseinOne/src {path_to_fasta} {data_dir}/T5_SC-PseAAC.csv Protein SC-PseAAC -f csv -lamada 1 -w 0.5",
        f"python3 -u /mnt/md0/Tools/PseinOne/src {path_to_fasta} {data_dir}/T5_PC-PseAAC.csv Protein PC-PseAAC -f csv -lamada 1 -w 0.5",

        f"python3 -u /mnt/md0/Public/一站式/txseml_backend_addon/txseml_addon/src/libexec/qso.py -i {path_to_fasta} -o {data_dir}/T5_QSO.csv ",
        f"python3 -u /mnt/md0/Public/一站式/txseml_backend_addon/txseml_addon/src/libexec/AAC.py -i {path_to_fasta} -o {data_dir}/T5_AAC.csv ",
        f"python3 -u /mnt/md0/Public/一站式/txseml_backend_addon/txseml_addon/src/libexec/TAC.py -i {path_to_fasta} -o {data_dir}/T5_TAC.csv ",
    ]
    for command in commands:
        subprocess.run(command,shell=True)


def runmodel(
    data_dir:str,
):
    model_list = ["XGBClassifier", "GaussianNB", "GradientBoostingClassifier",   
                                    "SVC","KNeighborsClassifier", 
                                    "RandomForestClassifier"]
    feature_list = ['18pp','AAC','BPBaac','CTDC','CTDT','CTriad','onehot',
                'PC-PseAAC','ppt25','QSO','SC-PseAAC','CTDD','DPC']
    rate = '1_100'
    allresult_dict = {}
    for model_name in model_list:
        a = 0
        tmp_all = 0
        while a < 5:
            tmp_result_dict = {}
            for feature_name in feature_list:
                model_save_dir = f"/mnt/md0/Public/一站式/txseml_backend_addon/lib/model/T5/{feature_name}/{rate}/{a}"
                if feature_name in ['PC-PseAAC','SC-PseAAC']:
                    val_df = pd.read_csv(f'{data_dir}/T5_{feature_name}.csv',header=None)
                else:
                    val_df = pd.read_csv(f'{data_dir}/T5_{feature_name}.csv')
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
                
                with open(f"{os.environ['LIB_DIR']}/model/T5/threshold.json", "r", encoding="UTF-8") as f:
                    threshold_dict = json.load(f)[f'{model_name}']
                
                tmp_result_dict[feature_name] = (
                np.nan_to_num(model.predict_proba(feature_), nan=0.0)[:, 1] >= threshold_dict[feature_name]
                ).astype(int)
                
            tmp = np.stack([
                    tmp_result_dict[feature_name1] for feature_name1 in feature_list
                ], axis=1).mean(axis=1)
            tmp_all += tmp
            a+=1
        allresult_dict[f'{model_name}'] = tmp_all/5
    return np.stack([
                        allresult_dict[model_name1] for model_name1 in model_list
                    ], axis=1).mean(axis=1)
        
            
            
            

    
