## <#1364827114670657616> — Infra & Cluster Stability

The TPU cluster saw significant stability work this week. Larry [noted](https://discord.com/channels/1354881461060243556/1364827114670657616/1511094455971746025) high TPU availability arriving in 10-minute chunks, and a feedback loop bug caused wandb timeout errors. rav and Russell Power deployed [multiple controller restarts](https://discord.com/channels/1354881461060243556/1364827114670657616/1511285199554609164) to address preemption thrashing, with rav [confirming](https://discord.com/channels/1354881461060243556/1364827114670657616/1511795513974849647) the thrashing was resolved but noting capacity constraints and pending GCP response on provisioning errors. Benjamin Feuer [filed a vLLM-on-TPU decode corruption issue](https://github.com/marin-community/marin/issues/6136), warning about PyTorch/XLA with dp>1 producing garbled outputs under load. He also [raised the question](https://discord.com/channels/1354881461060243556/1364827114670657616/1511845749430816879) of adding a sandboxed/limited-trust user tier to Iris, which Russell Power [said](https://discord.com/channels/1354881461060243556/1364827114670657616/1511850075704398065) is difficult due to GCP impersonation limitations. Michael Ryan [offered](https://discord.com/channels/1354881461060243556/1364827114670657616/1511868985325654076) to reduce his inference workload since v6e's and v5litepods were available to him.

## <#1462895580064911522> — Data Mixing

willheld shared a [rank correlation matrix](https://discord.com/channels/1354881461060243556/1462895580064911522/1511112439746400328) from the Dolma Swarm at <https://williamheld.com/wandb-analysis/#tab=corr>, expressing skepticism about compositional effects in pretraining mixes. The team dove deep into the [Microsoft AI tech report](https://microsoft.ai/wp-content/uploads/2026/06/main_20260602_2.pdf), with willheld [praising](https://discord.com/channels/1354881461060243556/1462895580064911522/1511548014492389418) the data mixing section's candor about trying and abandoning regression-based approaches in favor of alternating global/local optimization. yurusankyo [noted](https://discord.com/channels/1354881461060243556/1462895580064911522/1511567479154020474) that rank non-invariance appears when high-quality but low-diversity data is over-epoched, and that capping max epochs at 8 may restore invariance. Percy Liang's [one-liner "It's called a 'prior'"](https://discord.com/channels/1354881461060243556/1462895580064911522/1511550231924183066) was the week's second-most-reacted message. willheld also [built a custom dashboard](https://discord.com/channels/1354881461060243556/1462895580064911522/1511819106418954260) at <https://oa.williamheld.com> to track the swarm after WandB timeout issues.

## <#1356487738840318002> — Evals & Circuits

dlwh [proposed](https://discord.com/channels/1354881461060243556/1356487738840318002/1512594109368369312) investigating "circuits" / "basic skills" — small deterministic ops checking vocab/tokenizer coverage and arithmetic — finding that Qwen is significantly stronger across the board (analysis at <https://marin.community/analysis/ppl-circuit-coverage-gap/#heatmaps>). He plans to generate a few billion tokens of synthetic drill data ([issue #6070](https://github.com/marin-community/marin/issues/6070)). willheld [enthusiastically supported](https://discord.com/channels/1354881461060243556/1356487738840318002/1512596389295820860) aggressive dataset additions, noting the pipeline uses quality/domain tags rather than hard filters, so the mixing system can learn whether data is useful.

## <#1357057383830126652> — New Members & Introductions

15 new introductions this week, including Benjamin Feuer [introducing himself](https://discord.com/channels/1354881461060243556/1357057383830126652/1511848064623841301) as the new post-training lead (co-led OpenThoughts-Agent, 8 reactions — top message of the week). Notable newcomers include Gully Burns (scientific knowledge engineering), sbordt (post-doc from Tübingen working on MoE scaling), benjamintherien (PhD at Mila on distributed optimization), and clear_bubble (Stanford CS student working on test-time RL). 26 people joined via the welcome room.

## <#1354881461060243561> — General & Architecture

dlwh shared Larry's [MoE blog post](https://openathena.ai/blog/pretraining-speedup/) on pretraining speedups. When asked about linear attention/SSM plans, dlwh [said](https://discord.com/channels/1354881461060243556/1354881461060243561/1511838107023052871) there are no current plans but invited evidence-backed proposals. Furkan noted Qwen3.6-27B uses SWA effectively. Larry [raised](https://discord.com/channels/1354881461060243556/1354881461060243561/1512482942964863108) an idea about upscaling attention query magnitude by sequence position, pointing to [Length-Scaled Attention](https://arxiv.org/abs/2501.19399) from 18 months ago. dlwh also [addressed](https://discord.com/channels/1354881461060243556/1354881461060243561/1512952496941695127) new contributor onboarding, acknowledging the difficulty of creating "good first issue" tasks when agents can handle most of them, and [pointed to issue #6235](https://github.com/marin-community/marin/issues/6235) as a concrete contribution opportunity.

## <#1366632114316906506> — Code & Executor Cross-Region

rohithck [filed issue #6132](https://github.com/marin-community/marin/issues/6132) about the executor pinning all steps to the same region, limiting multi-model eval sweeps. Russell Power [explained](https://discord.com/channels/1354881461060243556/1366632114316906506/1511750771425808424) the challenge: removing region pins could cause cross-region data dependency failures. He suggested running executor directly from TPU model jobs with N replicas to compete for available work, and shared a [sweep example](https://github.com/marin-community/marin/blob/main/experiments/tutorials/train_tiny_sweep_tpu.py#L115) as an alternative.

## <#1374989195109466122> — Reinforcement Learning

Benjamin Feuer [announced](https://discord.com/channels/1354881461060243556/1374989195109466122/1512425813088276643) the [MarinSkyRL repo](https://github.com/marin-community/MarinSkyRL) for RL experiments and a 95-dataset agentic RL sweep. He [reported](https://discord.com/channels/1354881461060243556/1374989195109466122/1512791848882536529) that the OT-Agent 8B RL hero run reproduces on Perlmutter (A100s) but not Jupiter (GH200s) — the divergence traces to a training instability artifact where grad norm and entropy blow up on the older hardware, ironically bumping the model into a more exploratory regime that produces better final results. marianna13 [confirmed](https://discord.com/channels/1354881461060243556/1374989195109466122/1513172374625714298) seeing similar grad norm blowups on Jupiter. RL on MareNostrum was discussed, with JeniaJitsev confirming significant allocations remain. Ahmed M Ahmed [shared](https://discord.com/channels/1354881461060243556/1374989195109466122/1511364088784228554) a blog post on frontier asynchronous RL.

## <#1368297424086499359> — Data Curation

Benjamin Feuer [set up](https://discord.com/channels/1354881461060243556/1368297424086499359/1511729984539201688) agentic datagen via OT-Agent on Iris TPUs ([issue #6133](https://github.com/marin-community/marin/issues/6133)) with throughput grids and pre-emption stats. He also [created issue #6191](https://github.com/marin-community/marin/issues/6191) tracking 12 agentic trace datasets on HuggingFace. willheld [validated](https://discord.com/channels/1354881461060243556/1368297424086499359/1512623535867297925) rav's quality filters for code, showing a clean gradient where higher quality buckets correlate more strongly with coding perplexity improvements, visualized at <https://oa.williamheld.com>.

## <#1380235124011958313> — Long Context

Benjamin Feuer [released](https://discord.com/channels/1354881461060243556/1380235124011958313/1511688305375449098) agentic trace datasets from MiniMax 2.7 with up to 131k max context length across multiple HuggingFace repos. willheld [noted](https://discord.com/channels/1354881461060243556/1380235124011958313/1511774573937295392) he prefixes success/failure conditions as prompts rather than filtering, allowing the model to learn conditional behavior. Aditya Soni from CMU is [joining](https://discord.com/channels/1354881461060243556/1380235124011958313/1512134605958938765) for long-context experiments pending Iris onboarding.

## <#1385733711013871729> — Inference

dlwh [reported](https://discord.com/channels/1354881461060243556/1385733711013871729/1511034914059976784) that "goal mode" made Levanter inference ~10x faster (within ~12% of vLLM TPU) by copying vLLM patterns — notably without his direct involvement. He also found that scan-layers vs non-scan layers cause ~0.16 amax diff in logprob space. romain is [building](https://discord.com/channels/1354881461060243556/1385733711013871729/1511835505308733641) an agentic skill to automatically rebase and smoke-test vLLM and tpu-inference forks when upstream libraries release new versions.

## <#1365058937589858324> — Code Review

Multiple PRs circulated: [PR #5981](https://github.com/marin-community/marin/pull/5981) (dlwh), [PR #6144](https://github.com/marin-community/marin/pull/6144) automating weekly storage reports (Michael Ryan), [PR #6153](https://github.com/marin-community/marin/pull/6153) updating grug MoE and its README (Larry), and [PR #6216](https://github.com/marin-community/marin/pull/6216) fixing compilation caching for grug MoE (dlwh).

## <#1500987824206254120> — Tokenizer

Pranshu Chaturvedi is [training tokenizers](https://discord.com/channels/1354881461060243556/1500987824206254120/1511886225622171719) (Llama, GPT-OSS, Tokenmonster) at 262k vocab on 100B token subsets, adding checkpointing to fix multi-day runtimes. Bilibird [found](https://discord.com/channels/1354881461060243556/1500987824206254120/1512512935191117936) that Llama3's regex pattern groups 1-3 digits differently than Qwen3, explaining digit-level tokenization differences. willheld shared HuggingFace's [number tokenization blog](https://huggingface.co/spaces/huggingface/number-tokenization-blog).

## <#1365044508546568372> — MoE & Scaling

Kaiyue-Wen [raised](https://discord.com/channels/1354881461060243556/1365044508546568372/1511227646715887626) an important question about whether the move to multi-phase data mixtures with epoching requires rethinking the scaling ladder for architecture, optimizers, and scaling rules (e.g., linear LR vs WSD schedules).

## <#1418673157585502370> — DNA

Gonzalo Benegas [launched](https://discord.com/channels/1354881461060243556/1418673157585502370/1511850855261929562) a DNA research observatory at <https://openathena.ai/marin-dna/> with benchmark leaderboards and interpretation work. The best-scoring promoter model (`exp21-promoters-yolo`) shows the cleanest nucleotide dependency map aligned with known transcription factor binding sites.

## <#1375005693899309126> — Scaling Suite

markhart0034 [asked](https://discord.com/channels/1354881461060243556/1375005693899309126/1513202168595877929) about the T^-0.3 learning rate scaling (from the [Delphi blog post](https://openathena.ai/blog/delphi/)) not matching the expected T^-0.5, requesting pointers to raw experiment data.

## News & Research

- willheld shared [a paper from Jing et al.](https://arxiv.org/abs/2605.29548) and the [Microsoft AI tech report](https://microsoft.ai/wp-content/uploads/2026/06/main_20260602_2.pdf) which sparked extensive data mixing discussion
- Tony shared his paper with Percy Liang: [arxiv.org/abs/2605.26132](https://arxiv.org/abs/2605.26132), noting it was made possible by Marin codebase and infra
- Kaiyue-Wen shared [Tilde Research work](https://x.com/tilderesearch/status/2061771450168889432)
- Ahmed M Ahmed shared a [blog post on frontier asynchronous RL](https://luk-huang.github.io/personal-website/blog/is-frontier-asynchronous-rl-solved.html)
- Larry referenced [Length-Scaled Attention](https://arxiv.org/abs/2501.19399) on attention query magnitude scaling
- yurusankyo referenced [Scale Dependent Data Duplication](https://arxiv.org/abs/2603.06603)
