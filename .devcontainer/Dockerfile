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
ARG STYLELINT_VERSION=17.16.0

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
# Two stylelints exist in this environment on purpose, and the Makefile is
# explicit about which is used where:
#
#   stylelint 13 (project-local, via node_modules) lints src/**/*.scss. Its
#     ruleset, stylelint-config-sass-guidelines, is the one the sources were
#     written against and it passes today.
#
#   stylelint 17 (this global install) lints the generated dist/paper.css with
#     .stylelint-dist.json. That gate needs a rule the project-local version
#     does not have - declaration-property-value-no-unknown, added in a later
#     major - and without it nothing here would catch `padding: none`.
#
# Unifying the two means migrating the sources to a modern Sass module style,
# which is tracked as its own task rather than folded into landing the pipeline.
RUN sudo npm install -g \
    "html-validate@${HTML_VALIDATE_VERSION}" \
    "stylelint@${STYLELINT_VERSION}"

# Node's install of the project dependencies runs at container create, not build,
# so an image rebuild is not required when package.json changes.