## <#1462895580064911522> — Data Mixing & Surrogate Modeling

rav, yurusankyo, and Percy Liang had an extensive discussion about the approach for learning domain-weight-to-loss mappings. rav proposed [producing new data buckets with new classifiers and sampling the space](https://discord.com/channels/1354881461060243556/1462895580064911522/1528910100495077510), targeting a new datamix by August 15. Percy Liang outlined a key conceptual shift: [representing each document as a vector and each domain as an average](https://discord.com/channels/1354881461060243556/1462895580064911522/1529004208253304883), enabling reuse of old training examples when domains change.

yurusankyo reported that [two-phase mixture optimization has more degrees of freedom](https://discord.com/channels/1354881461060243556/1462895580064911522/1528921100145266999) making good model fits harder at the same swarm budget, and is working on better parametric surrogates, regularization, and swarm construction to improve the two-phase solution. rav ran a head-to-head comparison and [found KRR and effective-exposure DSP perform similarly](https://discord.com/channels/1354881461060243556/1462895580064911522/1529775938194116638) on shared heldout rows, while both severely underpredict extreme out-of-support policies. Percy Liang pushed for [visualizing projections and comparing methods](https://discord.com/channels/1354881461060243556/1462895580064911522/1529161044101169243) to better understand inductive biases.

## <#1516150256499163166> — MarinFold Progress

Tim O'Donnell posted a [detailed weekly update](https://discord.com/channels/1354881461060243556/1516150256499163166/1528795763839074394): fine-tuning on generated "only-correct" rollouts was **worse** than re-epoching original data ([#120](https://github.com/Open-Athena/MarinFold/issues/120), [#122](https://github.com/Open-Athena/MarinFold/pull/122)). A new **contacts-and-crops-v1** document structure was created keeping documents to 8192 tokens with 4.2M documents (~34.5B tokens). [Bio2Token was merged](https://discord.com/channels/1354881461060243556/1516150256499163166/1528796120233279648) ([#114](https://github.com/Open-Athena/MarinFold/pull/114)) for neural tokenizer-based structure prediction, and `<think>` pause tokens were added ([#123](https://github.com/Open-Athena/MarinFold/issues/123)).

Jacob Silterra published the [ESMFold2 Atlas distillation dataset](https://huggingface.co/buckets/open-athena/esm-atlas-esmfold2-distill), and Tim O'Donnell quickly generated contacts-v1 documents from it, resulting in [71B tokens from 67M proteins](https://discord.com/channels/1354881461060243556/1516150256499163166/1529853408654397451) — a 15x expansion over previous training data. Eric Czech's hyperparameter sweep ([#117](https://github.com/Open-Athena/MarinFold/issues/117)) has already pushed eval loss from 2.7566 down to 2.71.

## <#1364827114670657616> — Infrastructure & GPU Containers

Larry flagged [v4-2048 TPU reliability issues](https://github.com/marin-community/marin/issues/7430) and requested auto-retry on failure to avoid losing ~7 hours. Russell Power suggested increasing `max_task_failures` for Iris auto-retry. The Claude Code agent hit its weekly rate limit, breaking the Ops workflow ([noted by romain](https://discord.com/channels/1354881461060243556/1364827114670657616/1529179378335092917)).

dlwh proposed [switching to NVIDIA's JAX-Toolbox Docker container](https://discord.com/channels/1354881461060243556/1364827114670657616/1529616221845323909) as the default GPU image to fix cubin load failures ([#7421](https://github.com/marin-community/marin/issues/7421)), filing a [design doc PR](https://github.com/marin-community/marin/pull/7524). mcwitt cautioned that [it doesn't fully solve CUDA_ERROR_INVALID_VALUE](https://discord.com/channels/1354881461060243556/1364827114670657616/1529620021045891152) but may help get better NVIDIA support. Russell Power also fixed an overloaded Iris proxy on rn02a that was causing Finelog outages.

## <#1368297424086499359> — Data Curation & Stack v3

dlwh [announced Stack v3 is out](https://discord.com/channels/1354881461060243556/1368297424086499359/1529888602488836268), and rav immediately filed [#7558](https://github.com/marin-community/marin/issues/7558). willheld jumped on integration via [PR #7564](https://github.com/marin-community/marin/pull/7564), noting they'll need to [remove CommonPile Stack v2 data and possibly Dolma 3.5 code](https://discord.com/channels/1354881461060243556/1368297424086499359/1529894190077710387) since it's derived from v2. Data is being staged to CoreWeave. Benjamin Feuer also [called for help building verifiers](https://discord.com/channels/1354881461060243556/1368297424086499359/1529499435321790555) for 43 open-source Harbor-format datasets missing from TaskTrove ([#7418](https://github.com/marin-community/marin/issues/7418)).

## <#1483266366772351067> — Midtraining & Delphi

Benjamin Feuer reported that [DenseMixer A/B testing showed no beneficial outcome](https://discord.com/channels/1354881461060243556/1483266366772351067/1528706452162609215), clearing the path to unify Marin and OpenThoughts-Next SFT/midtraining on the Levanter framework. He also shared Delphi 1e23 scaling ladder results. Jeff H pointed to the [Delphi blog post](https://openathena.ai/blog/delphi/) in response to community questions.

## <#1356487738840318002> — Evals

Benjamin Feuer shared PRs for new evals and an [epic wishlist issue](https://discord.com/channels/1354881461060243556/1356487738840318002/1529190501796810797). rohithck opened [#7463](https://github.com/marin-community/marin/issues/7463) to investigate grading bottlenecks as a good first issue for new contributors. dlwh flagged that [evalalchemy's GPQAD shouldn't be trusted](https://github.com/marin-community/marin/issues/7527). Mrinal Kumar shared an initial eval set for review.

## <#1527756652890161292> — Architecture Experiments

Kaiyue-Wen shared results on [Identity HC (identity head composition)](https://discord.com/channels/1354881461060243556/1527756652890161292/1528576455469174784), which removes Sinkhorn and forces an identity matrix for H_res — a technique adopted by some Chinese labs. Mayank asked about running experiments with Hybrid NewtonSchultz optimization. willheld pointed to the [agent.md experiment procedure](https://github.com/marin-community/marin/blob/f9ea9385b0c9ee9beb8ccf4e45536c4f997654d1/experiments/grug/moe/agent.md) that documents how architecture ideas are assessed.

## <#1399998407657001062> — GPU Performance

dlwh implemented [alternating global/local attention with variable KV cache](https://github.com/marin-community/marin/issues/7201#issuecomment-5065678980), and Larry tested the PGLE flag achieving [25 MFU at 360B-A23B](https://discord.com/channels/1354881461060243556/1399998407657001062/1530411117279711383) — impressive given it includes Muon, Hyperball, attention gate, XSA, and gated norm. Jeff H [raised concerns about MFU drops in multi-rack settings](https://discord.com/channels/1354881461060243556/1399998407657001062/1530558695279431872); Larry acknowledged uncertainty there.

## <#1354881461060243561> — Community & General Updates

Percy Liang announced the [second Marin community meeting](https://discord.com/channels/1354881461060243556/1354881461060243561/1528616873325756557) (July 21), where willheld presented the data strategy ([slides](https://www.figma.com/deck/LcfkIgrKJUHV1DrJ40XbXb/Open-Athena-Pretraining-Data-Community-Meeting)). Percy shared key updates: the [67B-A2B trained on 2T tokens is ready](https://discord.com/channels/1354881461060243556/1354881461060243561/1529163870537777192) for post-training exploration, with training continuing to 10T tokens ([#6704](https://github.com/marin-community/marin/issues/6704)), and the data mix has ~23T tokens pre-dedup (~15T post-dedup).

Benjamin Feuer posted [non-agentic eval results](https://github.com/marin-community/marin/issues/7505#issuecomment-5047874097) showing the 67B-A2B lands mid-pack against comparable active-parameter models despite having 3x less FLOPS than the weakest competitor.

## <#1406020028884717719> — Safety & Red Teaming

Benjamin Feuer discussed [starting systematic red teaming](https://discord.com/channels/1354881461060243556/1406020028884717719/1529939554356957204) of Marin models when bandwidth allows. G Sandoval and nikhil both volunteered to help.

## <#1366632114316906506> — Code & Tooling

Ryan Williams surfaced [PR #7166](https://github.com/marin-community/marin/pull/7166) to fix an off-by-one bug in checkpoint naming where intermediate checkpoints were named `step-{kN}` but written after `kN+1` steps. dlwh created an [Agent MoE experiment playbook PR](https://github.com/marin-community/marin/pull/7623/changes) to summarize architecture experiments. rohithck asked about the canonical codepath for logprob scoring.

## <#1500987824206254120> — Tokenizer

Larry asked about tokenizer status for the next run. Bilibird is [investigating lexicon coverage](https://discord.com/channels/1354881461060243556/1500987824206254120/1529550947351527624) across major languages, coding, and domain-specific vocabularies, and exploring the connection between vocab size and lexicon coverage.

## <#1365044508546568372> — MoE Scaling

Larry noted a [707B parameter option has entered consideration](https://github.com/marin-community/marin/issues/7201#issuecomment-5054192424). catto asked about differentiable MoE approaches (e.g., ReMoE).

## News & Research

- Percy Liang shared the [Stack v3 dataset](https://huggingface.co/datasets/HuggingFaceCode/stack-v3-train) release on HuggingFace
- yurusankyo shared a new paper: <https://arxiv.org/abs/2607.20062v1>
- Luca from Common Crawl Foundation introduced himself, offering help with scientific publication data harvesting via [Grobid](https://github.com/grobidOrg/grobid)
- ixh open-sourced [mumwelt](https://github.com/Open-Athena/mumwelt) for documentation
