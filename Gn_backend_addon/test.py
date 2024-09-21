import pickle
import json
model = pickle.load(open('/mnt/md0/Public/一站式/txseml_backend_addon/lib/model/T3/18pp/1_100/0/GradientBoostingClassifier.pkl', "br"))
with open(f"/mnt/md0/Public/一站式/txseml_backend_addon/lib/model/T3/threshold.json", "r", encoding="UTF-8") as f:
    all_threshold_dict = json.load(f)['XGBClassifier']
    print(all_threshold_dict)