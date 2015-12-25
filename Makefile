test:
	./node_modules/karma/bin/karma start karma.conf.js --single-run

tdd:
	./node_modules/karma/bin/karma start karma.conf.js

coverage:
	./node_modules/karma/bin/karma start karma.coverage.js --single-run

build:
	./node_modules/.bin/gulp build

docs:
	rm -rf docs;\
	./node_modules/.bin/esdoc -c esdoc.json;

.PHONY: test tdd build coverage docs