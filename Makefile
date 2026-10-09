help:           ## Show this help.
	@fgrep -h "##" $(MAKEFILE_LIST) | fgrep -v fgrep | sed -e 's/\\$$//' -e 's/##//'

.PHONY: build
build:   ## Build everything: the stylesheet, then the documentation site
	@$(MAKE) build-css
	@$(MAKE) build-docs

.PHONY: build-css
build-css:   ## Compile src/ into dist/paper.css and dist/paper.min.css
	npm run css:build

.PHONY: build-docs
build-docs:   ## Build the documentation site into public/ (needs hugo on PATH; use the devcontainer)
	npm run docs:build

.PHONY: check
check:   ## Run the full verification gate - build, then lint the stylesheet and validate the built documentation (same sequence as CI)
	@# Order matters. The dist/ comparison has to happen *before* the rest of
	@# the build, while dist/ is still whatever the working tree contained:
	@# building first would sync dist/ to src/ and destroy the only evidence
	@# that it had been stale.
	@$(MAKE) _verify-reproducible
	@$(MAKE) build-docs
	@$(MAKE) lint
	@$(MAKE) check-config
	@$(MAKE) check-dist
	@$(MAKE) check-declarations
	@$(MAKE) check-docs
	@$(MAKE) _verify-dist-committed

.PHONY: lint
lint:   ## Lint the SCSS sources with the authoring ruleset
	npm run lint:src

.PHONY: check-config
check-config:   ## Verify the documented configuration override still works (assigning a value before the import wins)
	node scripts/check-config-override.mjs

.PHONY: check-dist
check-dist:   ## Check the generated stylesheet for correctness (unknown properties, at-rules, functions, units, values)
	@# Through the project's own install, like every other gate. This
	@# previously ran a second, globally-installed stylelint with an explicit
	@# `--config-basedir` because the ruleset needed
	@# declaration-property-value-no-unknown, which the project-local stylelint
	@# 13 did not have. The project now carries stylelint 17, so there is one
	@# linter and nothing resolves from outside node_modules. The
	@# `--config-basedir` is not needed either: .stylelint-dist.cjs extends
	@# nothing, so there is no shareable config to resolve.
	npm run lint:dist

.PHONY: check-docs
check-docs:   ## Validate the built documentation against the recorded error baseline
	node scripts/check-html.mjs

.PHONY: check-declarations
check-declarations:   ## Verify the generated stylesheet resolves to the recorded declaration set, property and value
	node scripts/record-css-declarations.mjs --check

.PHONY: check-declarations-update
check-declarations-update:   ## Re-record the generated stylesheet's declaration set. Only run this when a change to the output is intended; it hides unintended ones
	node scripts/record-css-declarations.mjs

.PHONY: check-docs-update-baseline
check-docs-update-baseline:   ## Re-measure the documentation HTML baseline. Only run this when the counts have genuinely dropped; it hides regressions you did not fix
	node scripts/check-html.mjs --update

.PHONY: check-determinism
check-determinism:   ## Verify dist/ is current for src/ and that the build is reproducible, without running the rest of the gate
	@$(MAKE) _verify-reproducible

# Copies dist/ as it currently stands, rebuilds, and compares. Two distinct
# problems surface here, and neither is visible anywhere else:
#
#   staleness       src/ changed but dist/ was never rebuilt, so what is
#                   committed does not correspond to the source.
#   non-reproducible  two builds of identical input differ, which would make
#                   every byte-comparison gate meaningless.
#
# This has to run before anything else builds. It also leaves a fresh build in
# place, so the later gates inspect current output.
.PHONY: _verify-reproducible
_verify-reproducible:
	@echo "==> verifying dist/ is current and the build is reproducible"
	@rm -rf .check-tmp && mkdir -p .check-tmp
	@cp dist/paper.css dist/paper.min.css .check-tmp/
	@$(MAKE) --no-print-directory build-css >/dev/null
	@cmp -s .check-tmp/paper.css dist/paper.css \
		|| { echo "error: a fresh build of src/ does not match dist/."; \
		     echo "       Either src/ changed without a rebuild, or the build is"; \
		     echo "       not reproducible. Run 'make build-css' and re-check."; \
		     git --no-pager diff --stat -- dist/; exit 1; }
	@cmp -s .check-tmp/paper.min.css dist/paper.min.css \
		|| { echo "error: dist/paper.min.css does not correspond to a fresh build"; exit 1; }
	@rm -rf .check-tmp
	@echo "    dist/ matches a fresh build, and two builds agree byte for byte"

# CI only. The question this asks - "is the *committed* stylesheet current?" -
# is only meaningful against a commit. On a dirty working tree a rebuilt dist/
# differs from HEAD by design, and failing there would punish the ordinary act
# of making the change this gate exists to police.
.PHONY: _verify-dist-committed
_verify-dist-committed:
	@if [ -z "$$CI" ]; then \
		echo "==> skipping the committed-dist check (CI only; run 'make build-css' and commit dist/ with your src/ change)"; \
	else \
		echo "==> verifying the committed dist/ matches src/"; \
		$(MAKE) --no-print-directory build-css >/dev/null; \
		git diff --exit-code --quiet -- dist/ \
			|| { echo "error: dist/ does not match a fresh build of src/."; \
			     echo "       Commit the rebuilt stylesheet, or revert your change to src/."; \
			     git --no-pager diff --stat -- dist/; exit 1; }; \
		echo "    dist/ is committed and in sync with src/"; \
	fi

.PHONY: serve
serve:   ## Serve the documentation site locally with live reload
	npm run dev

.PHONY: clean
clean:   ## Remove build output
	rm -rf public .check-tmp

# Help Source: https://gist.github.com/prwhite/8168133