echo precompilling
tsc static/ts/references.ts -noImplicitAny --sourcemap --out static/ts_comp/references.js

echo watching
find static/ts -iname \*.ts | ./bin/entr +notify &
sleep 1

while read F
do
    echo
    echo -n "Compilling $F ..."
    tsc static/ts/references.ts -noImplicitAny --sourcemap --out static/ts_comp/references.js
    echo " done"
done < notify

