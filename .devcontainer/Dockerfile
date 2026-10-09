FROM mcr.microsoft.com/devcontainers/base:bookworm

# Pinned exactly. Every one of these decides whether `make check` passes, so an
# unpinned range would let the build change under us.
#
# Hugo is provided here rather than through `hugo-bin`, which is removed: its
# install script downloads a binary at install time, and current npm refuses to
# run install scripts without explicit approval - so on a current Node it
# installed no Hugo at all. What it did install when permitted was a July 2020
# build, which docs/config.toml could then require, because that config named
# blackfriday and Hugo removed blackfriday in v0.100.0.
ARG HUGO_VERSION=0.131.0
ARG NODE_VERSION=22
ARG HTML_VALIDATE_VERSION=11.16.2

# Install system dependencies
RUN sudo apt-get update && \
    sudo apt-get install -y \
    build-essential \
    ca-certificates \
    curl \
    git \
    make \
    python3 \
    && sudo apt-get clean && \
    sudo rm -rf /var/lib/apt/lists/*

# Install Hugo
RUN mkdir -p /tmp/hugo && \
    cd /tmp/hugo && \
    curl -LO "https://github.com/gohugoio/hugo/releases/download/v${HUGO_VERSION}/hugo_${HUGO_VERSION}_linux-amd64.tar.gz" && \
    tar -xzf "hugo_${HUGO_VERSION}_linux-amd64.tar.gz" hugo && \
    sudo install -m 0755 hugo /usr/local/bin/hugo && \
    cd / && rm -rf /tmp/hugo

# Install Node.js
RUN curl -fsSL "https://deb.nodesource.com/setup_${NODE_VERSION}.x" | sudo -E bash - && \
    sudo apt-get install -y nodejs && \
    sudo apt-get clean && \
    sudo rm -rf /var/lib/apt/lists/*

# Install the verification tools.
#
# Only the tools that cannot come from npm as project dependencies live here.
# Hugo is one: `hugo-bin` was removed because its install script cannot run on a
# current npm, so the binary is fetched and pinned here instead. html-validate is
# the other, for the documentation gate.
#
# stylelint is deliberately NOT installed globally. It used to be, because the
# generated-CSS gate needed `declaration-property-value-no-unknown` and the
# project-local stylelint was 13, which does not have it -- so two linters
# existed and the Makefile had to say which ran where. The project now carries
# stylelint 17, so there is one linter and every gate runs it from
# node_modules.
RUN sudo npm install -g \
    "html-validate@${HTML_VALIDATE_VERSION}"

# Node's install of the project dependencies runs at container create, not build,
# so an image rebuild is not required when package.json changes.