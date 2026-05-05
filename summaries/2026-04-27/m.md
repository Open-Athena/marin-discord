## <#1356487738840318002> — Perplexity Gap Analysis & Eval Improvements

dlwh published a comprehensive [perplexity-gap analysis](https://marin.community/analysis/perplexity-gap/) comparing Marin 8B/32B against Qwen 3 and Llama 3.1 across code, prose, multilingual, scientific, and tabular text surfaces ([post](https://discord.com/channels/1354881461060243556/1356487738840318002/1498399220003111084)). Marin is roughly on par for edited English prose but has clear gaps in code (especially patches and tool-call results), multilingual text, and structured data. A separate agentic-trace analysis measured "patch gain" showing Marin significantly behind Qwen on understanding code diffs ([post](https://discord.com/channels/1354881461060243556/1356487738840318002/1498186408530149426)). The tracking epic is [#5005](https://github.com/marin-community/marin/issues/5005).

rohithck and dlwh had a substantive debate about whether BPB on task traces actually predicts downstream performance, with rohithck arguing the correlation breaks down for strong models and that arxiv-math BPB sometimes predicts MATH accuracy better than BPB on correct rollouts ([discussion](https://discord.com/channels/1354881461060243556/1356487738840318002/1498461632609783832)). dlwh acknowledged the noise but plans to focus on "natural" diffs, commits, and code world-model data.

rohithck and willheld identified false negatives in the lm-eval GSM8K grader—cases where the 1e23 model appeared worse than 1e22 were actually grader bugs ([message](https://discord.com/channels/1354881461060243556/1356487738840318002/1499102925870596129)). They agreed to create an internal "Marin version of GSM8K" with fixes while keeping standard graders for published numbers. Benjamin Feuer shared [AgentTrove](https://huggingface.co/datasets/open-thoughts/AgentTrove) and [TaskTrove](https://huggingface.co/datasets/open-thoughts/TaskTrove) datasets.

## <#1364827114670657616> — Iris Controller & Cluster Ops

Russell Power performed multiple Iris controller restarts throughout the week—migrating logs to a new server, fixing a bug Ahmed identified with co-scheduled preemption, and resolving a log server permissions issue that caused 10M pending lines ([message](https://discord.com/channels/1354881461060243556/1364827114670657616/1498810658312028333)). Ahmed discovered that interactive-priority jobs can't preempt multi-host batch jobs due to co-scheduling constraints ([message](https://discord.com/channels/1354881461060243556/1364827114670657616/1498518469753311293)); Russell explained the concern about freeing v5p-8 not guaranteeing a v5p-32 but agreed to file an issue for exact-match preemption.

dlwh and Russell Power agreed to consolidate to a single `marin-tmp` bucket (dropping soft-delete plans), simplifying the mirror:// scheme ([message](https://discord.com/channels/1354881461060243556/1364827114670657616/1498768749652738078)). rohithck hit intermittent `dupekit` build failures on ~20% of TPU workers; Russell attributed it to GitHub outages and prioritized setting up a PyPI mirror ([#4897](https://github.com/marin-community/marin/issues/4897)).

## <#1462895580064911522> — Data Mixing & Scale Modeling

yurusankyo reported on two weeks of joint mixture+scale modeling, settling on an anchor mixture regression + Chinchilla Approach 3 form ([update](https://discord.com/channels/1354881461060243556/1462895580064911522/1498808636926070936)). While the joint model doesn't yet produce convincing optima when directly optimized, the mixture optimized at 60M/1.2B maintains its perplexity advantage when validated at every scale. However, loss improvements on Uncheatable Eval don't translate strongly to benchmark performance.

dlwh pushed for expanding the eval basket beyond Uncheatable to include Paloma + MMLU train perplexity ([message](https://discord.com/channels/1354881461060243556/1462895580064911522/1498810339075035217)), noting "I am very against only picking datasets that correlate with downstream evals, but very much in favor of including datasets that correlate with downstream evals."

willheld applied Item Response Theory (inspired by [IRT for LLMs](https://arxiv.org/abs/2503.13335)) to decompose eval tasks into core capability axes and optimize an aggregate metric, reporting promising early results—the predicted optimal mixture looks sane though hasn't been tested yet ([message](https://discord.com/channels/1354881461060243556/1462895580064911522/1499919931167342643)). yurusankyo is running a 300M/6B eval swarm across 22 tasks with only 10 showing SNR > 2.0 at that scale.

## <#1385733711013871729> — vLLM TPU Sampling Bug & Fork Plans

rohithck discovered that the pinned `vllm_tpu` package (from December) ignores both seed and temperature on TPU, producing identical outputs regardless of settings ([message](https://discord.com/channels/1354881461060243556/1385733711013871729/1498805199949795471)). The root cause was a top-k bug fixed upstream in January but never picked up by the bundled package. rohithck noted he "burned a lot of TPUs this weekend generating the same completion thousands of times" ([message](https://discord.com/channels/1354881461060243556/1385733711013871729/1498819526845009981)).

Ahmed laid out a plan: romain works on merging JAX 0.9.2 to main ([PR #5278](https://github.com/marin-community/marin/pull/5278)), while Ahmed and rohithck work off Marin forks of vLLM + tpu-inference with more test coverage, then follow up by moving main to the forks ([plan](https://discord.com/channels/1354881461060243556/1385733711013871729/1498825185703235585)). rohithck requested keeping forks close to upstream initially to ease debugging.

## <#1365058937589858324> — Code Review Highlights

Heavy PR week with several design docs from marin-bot. Key proposals: **executor_in_training_job** ([PR #5243](https://github.com/marin-community/marin/pull/5243)) inverts executor pipeline launches to avoid cross-region egress; **stats_service** ([PR #5241](https://github.com/marin-community/marin/pull/5241)) adds typed schema-registered tables for the Iris dashboard; **iris_pypi_mirror** ([PR #5273](https://github.com/marin-community/marin/pull/5273)) sets up GAR pull-through mirrors to mitigate GitHub/PyPI outages; **iris_endpoint_proxy** ([PR #5336](https://github.com/marin-community/marin/pull/5336)) adds generic HTTP proxying through the controller. Ruff I001 import sorting was enabled repo-wide across 469 files ([PR #5314](https://github.com/marin-community/marin/pull/5314)). romain proposed deleting the vLLM Docker sidecar ([PR #5326](https://github.com/marin-community/marin/pull/5326)).

## <#1365044508546568372> — MoE Optimizer Ablations

Kaiyue-Wen ran gradient normalization ablations: normalizing every step gives 4% speedup at small scale but 4% slowdown at larger models ([#5182](https://github.com/marin-community/marin/issues/5182)). Larry reported promising results moving embeddings to AdamH with std=1 init (making RMS-norm a no-op on step 1), showing 5% speedup at small scale ([#5203](https://github.com/marin-community/marin/issues/5203)).

Pranshu Chaturvedi shared [optimizer ablation results](https://wandb.ai/marin-community/marin_moe/reports/Grug-MoE-optimizer-ablation-by-model-scale--VmlldzoxNjY1ODkyMw) comparing Muon/MuonH vs AdamH. The best Muon variant is roughly neutral with AdamH, ignoring compute overhead ([message](https://discord.com/channels/1354881461060243556/1365044508546568372/1498818986887090236)). Larry hopes to demonstrate 10–15% compute efficiency gain before mapping scaling behavior. Kaiyue-Wen noted Muon's tokens-per-second is surprisingly competitive on MoE (Amdahl's law). Next steps: Vizier-tuned Muon with 2x batch, isoflop curves at 3e18/1e19/3e19, and potentially Normuon/momentum warmup.

dlwh shared a DeepSeek MoE infrastructure paper ([arxiv](https://arxiv.org/abs/2603.07685)), noting most sharding/fusion takeaways follow from first principles and that "fp4 continues to scare me."

## <#1366632114316906506> — Executor Footguns & Artifact System

Ahmed hit a critical footgun: Iris moved his training job to a different region, which changed MirrorFS paths, altered the output hash, and broke checkpoint resumption ([message](https://discord.com/channels/1354881461060243556/1366632114316906506/1498407974786568462)). The root cause was StepSpec using string-interpolated paths that include region-specific bucket names. Russell Power proposed moving toward a named artifact system where executor outputs get meaningful names and training runs load artifacts by name rather than computed paths ([message](https://discord.com/channels/1354881461060243556/1366632114316906506/1498409701015289919)). rav suggested extending `Artifact.load()` to accept bucket-less paths resolved by current region.

rohithck reported a fray bug where inference workers were all assigned to the same TPU VM ([#5219](https://github.com/marin-community/marin/issues/5219)), working around it by disabling co-scheduling for single-VM TPUs.

## News & Research

- Larry noted [Hyperball doing well on nanogpt optimization speedrun](https://discord.com/channels/1354881461060243556/1356487690559684638/1500004944965799976), curious about more aggressive decay schedules
- willheld shared [Nitrobrew from Tilde Research](https://blog.tilderesearch.com/blog/nitrobrew)
- Kaiyue-Wen shared [OLMPool](https://allenai.org/papers/olmpool) from AI2
- catto released [flash-attention-residuals](https://github.com/catswe/flash-attention-residuals) Triton kernels (1.4x over torch compile)
- rohithck shared [talkie-coder](https://github.com/RicardoDominguez/talkie-coder) — post-training talkie on SWE-bench gets 4.5% accuracy with ~5% pass@100 on HumanEval
- cs2716 shared a paper on translating high-quality English data for multilingual gains ([arxiv](https://arxiv.org/abs/2602.15210))
- Kevin Xiang Li highlighted [AgentTrove](https://huggingface.co/datasets/open-thoughts/AgentTrove) (1.6M rollouts) and [TaskTrove](https://huggingface.co/datasets/open-thoughts/TaskTrove) (750K tasks) from the OT-agent team
- Ahmed shared a [talk from Rishabh on scaling RL](https://x.com/agarwl_/status/2049263264249368906) noting trainer-inference mismatch is even worse for MoEs
- Ahmed completed LoRA+DPO init sweeps showing zero-A/gaussian-B init improves stability ([#4556](https://github.com/marin-community/marin/issues/4556#issuecomment-4340726988))
