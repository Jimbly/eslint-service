@echo off
echo #################
echo Regular eslint
echo #################
call eslint --format json --stdin --stdin-filename F:\\src\\eslint-service\\test\\test_good.js < test\test_good.js > out1r.txt
call eslint --format json --stdin --stdin-filename F:\\src\\eslint-service\\test\\test_bad.js < test\test_bad.js > out2r.txt

echo #################
echo eslint-service
echo #################
node bin/eslint-service --format json --stdin --stdin-filename F:\\src\\eslint-service\\test\\test_good.js < test\test_good.js > out1s.txt
node bin/eslint-service --format json --stdin --stdin-filename F:\\src\\eslint-service\\test\\test_bad.js < test\test_bad.js > out2s.txt

echo #################
echo Check!
echo #################

diff out1r.txt out1s.txt
diff out2r.txt out2s.txt

del out1r.txt
del out2r.txt
del out1s.txt
del out2s.txt

