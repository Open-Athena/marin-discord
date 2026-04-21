## <#1364827114670657616> — Iris Infrastructure Stability

The Iris controller had a rough week, requiring roughly 10 restarts to address a cascade of issues. On Sunday, Russell Power restarted for a checkpoint-related slowdown that caused [Job Logs to go empty](https://discord.com/channels/1354881461060243556/1364827114670657616/1493393830664208424) and throughput to tank. A [region constraint bug introduced by a Claude-authored PR](https://discord.com/channels/1354881461060243556/1365058937589858324/1493462224549969941) (#4681) prevented jobs with hard region constraints from scheduling after the reboot—willheld identified and fixed it in [PR #4720](https://github.com/marin-community/marin/pull/4720). Mid-week, controller overload during checkpointing caused widespread job failures for Eric Czech, Larry, and yurusankyo, with [some users unable to complete jobs for 2 days](https://discord.com/channels/1354881461060243556/1364827114670657616/1494416173297828121). Russell landed checkpoint fixes and bumped non-preemptible CPU max workers. rav identified [the root cause of missing-job errors](https://discord.com/channels/1354881461060243556/1364827114670657616/1494453568625967235), and the prod Iris dashboard is now accessible at [iris.oa.dev](https://discord.com/channels/1354881461060243556/1364827114670657616/1493692493374554293) (no more localhost forwarding). By Friday, Russell discovered the team was generating [>10M log lines/minute](https://discord.com/channels/1354881461060243556/1364827114670657616/1495570501622304830), which wasn't accounted for. Eric noted that things have [stabilized enough for a Claude-supervised loop to keep small sweeps running ~12 hours](https://discord.com/channels/1354881461060243556/1364827114670657616/1495038061103419392), though sporadic latency spikes remain.

## <#1365058937589858324> — Code Review & Scheduling Fixes

willheld's [PR #4720](https://github.com/marin-community/marin/pull/4720) fixed the region scheduling regression, with Russell performing a live migration and [17 tasks getting correctly preempted](https://discord.com/channels/1354881461060243556/1365058937589858324/1493490256899735582) immediately after. The original offending [PR #4681](https://github.com/marin-community/marin/pull/4681) was flagged as Claude going off-spec—making orthogonal worker registration changes. Russell also submitted [PR #4874](https://github.com/marin-community/marin/pull/4874) (test improvements) and [PR #4877](https://github.com/marin-community/marin/pull/4877). Tony migrated post-training evals to Iris and added OlympiadBench Physics in [PR #4894](https://github.com/marin-community/marin/pull/4894).

## <#1462895580064911522> — Data Mixing

Percy Liang asked for head-to-head comparisons of mixing strategies. yurusankyo shared [comprehensive BPB results](https://discord.com/channels/1354881461060243556/1462895580064911522/1493069906487410890): Proportional 1.092, UniMax 1.083, Uniform 1.079, Olmix 1.069, and their GRP method at **1.036** on uncheatable eval—a ~0.03 BPB improvement over the best prior baseline. The latest GRP form uses power-law satiety (replacing log), per-family overfit penalties, and per-family power-law curvatures. Benchmark results at small scale are noisy, but willheld noted [runs at more realistic scales](https://discord.com/channels/1354881461060243556/1462895580064911522/1493260595242209473) are checking whether GRP's advantage holds as S/N decreases. yurusankyo posted [60M→300M BPB correlation plots](https://discord.com/channels/1354881461060243556/1462895580064911522/1494123822071418890) and is collecting ~90 more data points across 130M, 500M, and 1.2B scales. Percy flagged an interesting finding that [proportional transfers badly across scales while uniform is okay](https://discord.com/channels/1354881461060243556/1462895580064911522/1494329962684088442)—yurusankyo suspects it relates to how CommonCrawl HQ gets downsampled in the midtrain phase.

## <#1366985639743979541> — Levanter & LoRA/DPO Debugging

Ahmed M Ahmed has been chasing a [deeply weird LoRA+DPO training divergence](https://discord.com/channels/1354881461060243556/1366985639743979541/1493355243734565014) that only manifests on v5p-8/v6e-8 but not v5p-16/v6e-16. After systematically ruling out dataset, gradient accumulation, kernel block sizes, and fp32 precision, he found that [switching from FSDP to tensor-parallel](https://discord.com/channels/1354881461060243556/1366985639743979541/1494819653141270548) (`{data:1, model:4}`) fixed it. Even more bizarrely, overnight Claude experiments revealed that [permuting the device order in the logical mesh changes results](https://discord.com/channels/1354881461060243556/1366985639743979541/1495202551761731644), with the standard 0-3 order adding 28 extra bf16 all-reduces in the HLO. Branch with repro: <https://github.com/marin-community/marin/tree/dpo_lora_broke>.

Separately, rohithck asked about Levanter inference vs vLLM and submitted PRs for [prompt_logprobs with APC](https://github.com/marin-community/vllm/pull/1) in the marin vLLM fork—noting that [Codex basically one-shotted it](https://discord.com/channels/1354881461060243556/1366985639743979541/1494155934119886929). The vLLM fork switch is blocked on a JAX 0.9.2 MoE training regression that romain is investigating.

## <#1366632114316906506> — Code Architecture & Tooling

dlwh flagged [concerns about executor interaction with Iris scheduling across regions](https://discord.com/channels/1354881461060243556/1366632114316906506/1493275959493918833), recommending single-region for now. Russell explained that mirror FS checks step markers only in the local region, noting that [rebuilding executor is deep on the TODO list](https://discord.com/channels/1354881461060243556/1366632114316906506/1493299119438041151). rohithck filed issues for [actor initialization on remote TPU nodes](https://github.com/marin-community/marin/issues/4714) and [fray test coverage gaps](https://github.com/marin-community/marin/issues/4728). dlwh suggested [prioritizing R2 migration to help outside contributors](https://discord.com/channels/1354881461060243556/1366632114316906506/1493334834574266481) (chloe and xinyu23 expressed interest in GPU work). Russell also floated an [experiment on automated documentation generation](https://github.com/marin-community/marin/pull/4321) as a potential research project.

## <#1356487690559684638> — News & Research

willheld shared Larry's [quantile-balancing blog post](https://openathena.ai/blog/quantile-balancing/) covering MoE experiments (10 reactions—most reacted message of the week), with credit to Pranshu Chaturvedi for early QB exploration. Percy Liang shared a [fine-tuning analysis post](https://discord.com/channels/1354881461060243556/1356487690559684638/1494328959649714236) (cc Michael Ryan), which Colin Raffel identified as the paperified version of a HuggingFace space. cs2716 shared a thread on [Opus 4.7's potentially less efficient tokenizer](https://x.com/JulieKallini/status/2044890881141228029). kian shared their [RLVR mini-book v0](https://rlvrbook.com) in #random.

## <#1375164400239120504> / <#1357057383830126652> — Community Growth

~30 new members joined the welcome room, with a notable spike on Apr 18. Seven people posted introductions spanning backgrounds in DLRM/advertising (Bruno), agent systems at Scale AI (Denis), GRPO post-training at Bill (Kartik_S), fintech LLMs in Tokyo (sourav), aerospace/medical VLMs (Sokhna), search infrastructure at Kagi/Common Crawl (greyleader77), and ML systems (xo).

## <#1365044508546568372> — MoE Training

Larry reported the [130B/A29B MoE run is ~5% complete](https://discord.com/channels/1354881461060243556/1365044508546568372/1493715600319713373) and looking good, with an estimated 20-40 days remaining. dlwh [reconstituted the 1e23 run on 2× hardware](https://discord.com/channels/1354881461060243556/1365044508546568372/1495530492001386496) with ep=8 and ragged_all_to_all, achieving ~20% better MFU. Train loss is nearly identical, but perplexity evals are worse—possibly due to eval condition mismatch or overflow.

## <#1493722964644990996> — Downstream Scaling & Proxy Evals

rohithck [created the #downstream-scaling channel](https://discord.com/channels/1354881461060243556/1493722964644990996/1493723041484636252) to track the proxy evals project, linking the [stem issue #4550](https://github.com/marin-community/marin/issues/4550) (cc Tony, Ahmed, Kevin, willheld).

## <#1462884917292699669> — Automated Research & Claude Regression

The team is experiencing a [noticeable Claude quality regression](https://discord.com/channels/1354881461060243556/1462884917292699669/1493842243293810849) over recent weeks, impacting automated workflows. willheld discovered that [Anthropic killed sleep loops](https://discord.com/channels/1354881461060243556/1462884917292699669/1493806566531661984) in Claude's tool use. Ahmed reported his [Claude monitor stopped being useful](https://discord.com/channels/1354881461060243556/1462884917292699669/1494387251621265549)—detecting dead jobs but not restarting them—though it attempted an auto-restart ladder with fallback strategies.

## News & Research

- willheld shared a paper on twin-head architectures: <https://arxiv.org/abs/2604.09258> (doubles memory but shows significant gains for same loss)
- willheld shared: <https://arxiv.org/abs/2604.12946>
- Ahmed shared a paper on [experience replay for LLM RL](https://arxiv.org/pdf/2604.08706)
- cs2716 shared a [thread on Opus 4.7 tokenizer efficiency](https://x.com/JulieKallini/status/2044890881141228029)
- Omi shared a Nature paper: <https://www.nature.com/articles/s41586-026-10319-8>
- kian shared [RLVR mini-book v0](https://rlvrbook.com)
- Ahmed flagged a new [agent eval benchmark](https://x.com/matternjustus/status/2044876224896565679)
