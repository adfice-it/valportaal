# SPDX-License-Identifier: GPL-3.0-or-later
# Copyright (C) 2021 S. K. Medlock, E. K. Herman, K. M. Shaw
#
# Makefile cheat-sheet:
#
# $@ : target label
# $< : the first prerequisite after the colon
# $^ : all of the prerequisite files
# $* : wildcard matched part
#
# Target-specific Variable syntax:
# https://www.gnu.org/software/make/manual/html_node/Target_002dspecific.html
#
# patsubst : $(patsubst pattern,replacement,text)
#       https://www.gnu.org/software/make/manual/html_node/Text-Functions.html

SHELL=/bin/bash

default: check

node_modules/ws/lib/websocket-server.js:
	npm install
	@echo "$@ complete"

node_modules/jest-fetch-mock/package.json:
	npm install
	@echo "$@ complete"

oauth2test/oauth2.js:
	git submodule update --init --recursive

update:
	npm update
	git submodule update --init --recursive

npmsetup: node_modules/ws/lib/websocket-server.js \
		node_modules/jest-fetch-mock/package.json
	@echo "$@ complete"


dbconfig.env: portal-dbconfig.env
	ln -sv $< $@

portal-dbconfig.env: docker.portal-dbconfig.env
	if [[ ! -e $@ ]]; then ln -sv $< $@; else touch $@; fi

portal-db-scripts.env: docker.portal-db-scripts.env
	ln -sv $< $@

links: portal-db-scripts.env portal-dbconfig.env dbconfig.env

portal-dbsetup: npmsetup portal-db-scripts.env docker.portal-db-scripts.env
	bin/setup-new-db-container.sh docker.portal-db-scripts.env
	bin/db-create-portal-tables.sh portal-db-scripts.env

dbsetup: links portal-dbsetup

valportaal-static/ejs.3-1-6.js:
	wget https://github.com/mde/ejs/releases/download/v3.1.6/ejs.js
	mv -iv ejs.js $@

unit-test: npmsetup links valportaal-static/ejs.3-1-6.js
	npm test

unit: unit-test

fake-valportaal-nginx-access.deidentified.log: \
		./valportaal-log-transform.js \
		./fake-valportaal-nginx-access.log
	node $^ $@

check-log-transform: fake-valportaal-nginx-access.deidentified.log
	if [ ! -e $< ]; then false; fi
	if [ "$$(grep -c '145.117.146.114' $< )" -ne 0 ]; then false; fi
	if [ "$$(grep -c '87.233.128.195' $< )" -ne 0 ]; then false; fi
	if [ "$$(grep -c 'advice.html' $< )" -ne 7 ]; then false; fi
	rm fake-valportaal-nginx-access.deidentified.log

valportaal.env:
	ln -sv example-valportaal.env valportaal.env

check: dbsetup valportaal-static/ejs.3-1-6.js unit-test check-log-transform \
		./valportaal.env oauth2test/oauth2.js
	./valportaal-acceptance-test.sh
	@echo "SUCCESS $@"

tidy:
	js-beautify --replace --end-with-newline \
		valportaal-acceptance-test.js \
		ValPortaalServer.js \
		valportaal.js \
		valportaal-log-transform.js \
		valportaal-static/advice.js

tar:
	tar cvf valportaal.tar \
		advice.html.test.js \
		valportaal.js \
		ValPortaalServer.js \
		Makefile.basic \
		package.json \
		README.md \
		$(shell find valportaal-static -type f) \
		$(shell find valportaal-express-views -type f)
#Will have to manually copy in:
# adfice-db.js
# ping-db.js
# bin/db-create-portal-tables.sh
# sql/createPortalTables.sql
# sql/drop_all_tables.sql
# since they are symlinked into this repo and tar does not like relative paths

# custom for install:
# portal-db-scripts.env
# portal-dbconfig.env
# dbconfig.env
