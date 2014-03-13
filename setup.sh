set -e

VER=node-v0.10.26-linux-x64

pip install -r requirements.txt
cd /tmp/
wget http://nodejs.org/dist/v0.10.26/$VER.tar.gz
tar xzvf $VER.tar.gz
cp -R $VER/* $VIRTUAL_ENV
rm $VER.tar.gz
rm -R $VER
npm install -g typescript
