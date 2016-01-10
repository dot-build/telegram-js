test:
	./node_modules/karma/bin/karma start karma.conf.js --single-run

tdd:
	./node_modules/karma/bin/karma start karma.conf.js

watch:
	./node_modules/.bin/gulp watch

build:
	./node_modules/.bin/gulp build

docs:
	rm -rf docs;\
	./node_modules/.bin/esdoc -c esdoc.json;

.PHONY: test tdd build watch docs