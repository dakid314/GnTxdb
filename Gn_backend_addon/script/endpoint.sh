# pip3 install -r ./config/requirements.txt

_ENV_FILE_NAME=".env"
if [ $ENV_FILE_NAME ]; then
    _ENV_FILE_NAME=$ENV_FILE_NAME
fi
. ./config/$_ENV_FILE_NAME

python3 -u src/server.py