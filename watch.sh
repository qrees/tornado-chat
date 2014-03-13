find static/ts -iname \*.ts | xargs tsc --sourcemap

find static/ts -iname \*.ts | ./bin/entr +notify &
sleep 1

while read F
do
    echo
    echo -n "Compilling $F ..."
    tsc $F --sourcemap
    echo " done"
done < notify

