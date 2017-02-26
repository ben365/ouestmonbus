#
# Docker for ouestmonbus.com data generator
#
# docker build . -t ouestmonbus --build-arg ssh_key_content_github="$(cat ~/.ssh/id_rsa_github)"
# docker run ouestmonbus /ouestmonbus/generator/gen.sh 1
#

FROM alpine:latest
MAINTAINER Benoit S. Meunier <benoit@systemd.info>

ARG ssh_key_content_github

RUN apk add --no-cache bash nodejs git openssh && \
	git config --global user.name "Ben" && \
	git config --global user.email "benoit@systemd.info" && \
	mkdir ~/.ssh && \
	echo "Host github.com" > ~/.ssh/config && \
	echo "$ssh_key_content_github" > ~/.ssh/id_github && \
	chmod 600 ~/.ssh/id_github && \
	echo "	IdentityFile ~/.ssh/id_github" >> ~/.ssh/config && \
	echo "	StrictHostKeyChecking no" >> ~/.ssh/config && \
 	git clone git@github.com:ben365/ouestmonbus.git /ouestmonbus && \
	cd /ouestmonbus/generator && \
	npm install

VOLUME /ouestmonbus

CMD /bin/bash