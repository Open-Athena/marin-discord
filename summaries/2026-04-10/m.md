## <#1364827114670657616> — Iris Infrastructure

The Iris cluster manager had a turbulent week with **multiple controller restarts** to address scheduling, preemption, checkpoint, and job-log bugs. romain [announced](https://discord.com/channels/1354881461060243556/1364827114670657616/1491958926294519881) Ray worker reductions ([PR #4604](https://github.com/marin-community/marin/pull/4604)), while Tony [requested](https://discord.com/channels/1354881461060243556/1364827114670657616/1491964103458160710) a more gradual transition for his SFT paper work. rav [shared](https://discord.com/channels/1354881461060243556/1364827114670657616/1493692493374554293) the new prod Iris dashboard at <https://iris.oa.dev>, eliminating the need for localhost forwarding.

Russell Power pushed several fixes throughout the week: a UV package rename issue ([workaround](https://discord.com/channels/1354881461060243556/1364827114670657616/1492250677609758951)), preemption glitches, and a checkpoint-related controller slowdown that was [causing job failures](https://discord.com/channels/1354881461060243556/1364827114670657616/1494412233797795851) for Larry and Eric Czech. Ahmed M Ahmed [asked about](https://discord.com/channels/1354881461060243556/1364827114670657616/1492965113366450217) co-scheduling RL trainer/worker pairs, and jobs were getting incorrectly placed on reserved v4-2048 nodes due to [exhausted non-preemptible CPU](https://discord.com/channels/1354881461060243556/1364827114670657616/1494095384719659048). By week's end, Russell Power bumped max non-preemptible CPU slices and rav found the [root cause](https://discord.com/channels/1354881461060243556/1364827114670657616/1494453568625967235) of missing job errors.

## <#1365058937589858324> — Iris Scheduling Bug & Code Review

A Claude-authored [PR #4681](https://github.com/marin-community/marin/pull/4681) introduced a region registration bug that broke scheduling for jobs with hard region constraints. willheld [identified the root cause](https://discord.com/channels/1354881461060243556/1365058937589858324/1493460220070854676) and submitted [PR #4720](https://github.com/marin-community/marin/pull/4720) to fix it. Russell Power deployed a migration at ~6am that [immediately preempted 17 tasks](https://discord.com/channels/1354881461060243556/1365058937589858324/1493490256899735582), restoring correct scheduling behavior. willheld [noted](https://discord.com/channels/1354881461060243556/1365058937589858324/1493462224549969941) Claude went "pretty far off spec" in the offending PR.

Separately, Ahmed M Ahmed submitted [PR #4637](https://github.com/marin-community/marin/pull/4637) adding LoRA to DPO, and dlwh asked for review on tdv's [PR #4684](https://github.com/marin-community/marin/pull/4684) adding native Reasoning Gym environments.

## <#1462895580064911522> — Data Mixing

yurusankyo's GRP (Gaussian Regression Process) functional form is producing strong results: **1.036 BPB** on uncheatable eval, vs Olmix at 1.069, Uniform at 1.079, UniMax at 1.083, and Proportional at 1.092 ([summary](https://discord.com/channels/1354881461060243556/1462895580064911522/1493069906487410890)). The latest form uses power law satiety curves and per-family overfit penalties. Percy Liang [pushed](https://discord.com/channels/1354881461060243556/1462895580064911522/1493046589961273476) for head-to-head comparisons against all baselines.

Scaling experiments are now running at 300M parameters, with [good rank correlation](https://discord.com/channels/1354881461060243556/1462895580064911522/1494123822071418890) between 60M and 300M performance. Percy Liang [noted](https://discord.com/channels/1354881461060243556/1462895580064911522/1494329962684088442) that proportional mixing transfers poorly across scales while uniform does okay. yurusankyo is working on ~90 more data points across 130M, 500M, and 1.2B to build scaling curves, and is [gravitating toward](https://discord.com/channels/1354881461060243556/1462895580064911522/1494425952887898283) a scaling-curve-on-retained-epochs formulation.

## <#1366985639743979541> — Levanter & vLLM

Ahmed M Ahmed is debugging a [mysterious LoRA-DPO training divergence](https://discord.com/channels/1354881461060243556/1366985639743979541/1493355243734565014) that appears on v5p-8/v6e-8 but not on v5p-16/v6e-16. dlwh suspected gradient accumulation or fused CE kernel block sizes; Ahmed systematically narrowed it down but [hasn't isolated it yet](https://discord.com/channels/1354881461060243556/1366985639743979541/1494477016819433552). dlwh [suggested](https://discord.com/channels/1354881461060243556/1366985639743979541/1494486557283979315) running entirely in fp32 as a next diagnostic step.

rohithck submitted PRs for **prompt_logprobs with APC** in Marin's vLLM and tpu-inference forks ([vllm PR](https://github.com/marin-community/vllm/pull/1), [tpu-inference PR](https://github.com/marin-community/tpu-inference/pull/2)), noting that [Codex basically one-shotted it](https://discord.com/channels/1354881461060243556/1366985639743979541/1494155934119886929). The switch to these forks is blocked on resolving a JAX 0.9.2 MoE training regression that romain is leading.

## <#1366632114316906506> — Code & Executor Issues

Multi-region executor scheduling continues to cause headaches. rohithck [hit](https://discord.com/channels/1354881461060243556/1366632114316906506/1492788118972268565) a GCS region mismatch error, and dlwh [expressed deep worries](https://discord.com/channels/1354881461060243556/1366632114316906506/1493275959493918833) about executor-Iris interaction, recommending single-region for now. Ahmed M Ahmed [raised](https://discord.com/channels/1354881461060243556/1366632114316906506/1493297868172427447) a quirk where mirror FS copies data in one region but retokenizes in another.

rohithck filed [issue #4714](https://github.com/marin-community/marin/issues/4714) for a `create_actor` bug where actor environments aren't properly initialized on different node types, and [issue #4728](https://github.com/marin-community/marin/issues/4728) for broadening fray test coverage. dlwh noted that the R2 storage move should help outside GPU contributors like chloe and xinyu23.

## <#1365044508546568372> — MoE

Larry [consolidated the MoE recipe](https://discord.com/channels/1354881461060243556/1365044508546568372/1492263305681567977) with [PR #4636](https://github.com/marin-community/marin/pull/4636) and posted a public metrics leaderboard. The **130B/A29B MoE run** is underway with early results [looking good](https://discord.com/channels/1354881461060243556/1365044508546568372/1493715600319713373) at 5% completion (est. 20–40 days total). chloe [offered](https://discord.com/channels/1354881461060243556/1365044508546568372/1493002736633909348) to benchmark grug MoE vs Megatron on H100, and dlwh was [enthusiastic](https://discord.com/channels/1354881461060243556/1365044508546568372/1492280761968234518): "Iris is fully operational, moe looks 🔥. i should take more weeks off."

## <#1355318637854199848> — SFT & Distillation

Ahmed M Ahmed [shared](https://discord.com/channels/1354881461060243556/1355318637854199848/1493005523744854108) a distillation paper, and willheld [identified](https://discord.com/channels/1354881461060243556/1355318637854199848/1493005668666441800) online distillation as his #1 desired RL feature for Marin. nato emphasized the need for a fully open distilled model. Jeff H suggested filing a tracking issue.

## <#1462884917292699669> — Automated Research Tooling

Multiple team members reported **Claude Code regression**. willheld [noted](https://discord.com/channels/1354881461060243556/1462884917292699669/1493806566531661984) that sleep loops were killed in Claude's sandbox. rohithck [confirmed](https://discord.com/channels/1354881461060243556/1462884917292699669/1493842243293810849) the regression has been noticeable for days. Ahmed M Ahmed [found](https://discord.com/channels/1354881461060243556/1462884917292699669/1494387251621265549) his Claude monitor failed to restart dead jobs overnight, just reporting "jobs are dead" instead of acting.

## <#1493722964644990996> — Downstream Scaling

rohithck [created](https://discord.com/channels/1354881461060243556/1493722964644990996/1493723041484636252) a new channel to track the proxy evals project ([stem issue #4550](https://github.com/marin-community/marin/issues/4550)), cc'ing Tony, Ahmed, Kevin, and willheld.

## <#1357057383830126652> — Community

11 new members joined the welcome room. Notable introductions: **Ty Feng** (ML engineer with RL infra background, TRC grant holder), **Chris** (maths background, robotics-interested), **Bruno** (DLRM/distributed systems), **Denis** (Scale AI, agent systems), and **Kartik** (Bill, LLM post-training/GRPO). willheld [offered](https://discord.com/channels/1354881461060243556/1357057383830126652/1492209535958519808) Ty guidance on setting up Marin for individual TRC users and encouraged filing docs issues.

## News & Research

- willheld shared a [paper from Tristan](https://arxiv.org/abs/2604.08423) on differentiable proxies for agentic tasks, relevant to SWE-ZERO work
- cs2716 shared [PathMoE](https://x.com/askalphaxiv/status/2039400773105090619) — path-constrained MoE with shared router weights across layer blocks, tested up to 16B
- willheld shared a [paper on dual-model training](https://arxiv.org/abs/2604.09258) that doubles memory but shows strong gains at same loss
- Ahmed M Ahmed shared a paper on [experience replay for LLM RL](https://arxiv.org/pdf/2604.08706)
- willheld shared a [paper](https://arxiv.org/abs/2604.12946) with "so many keywords I like"
- **Larry published a [quantile balancing blog post](https://openathena.ai/blog/quantile-balancing/)** summarizing MoE load-balancing experiments, with credit to Pranshu Chaturvedi and willheld
- Kevin Xiang Li [implemented SWE-ZERO in Marin](https://discord.com/channels/1354881461060243556/1368297424086499359/1492293100058706011) with 1000 trajectories, 87.4% unique bash commands (11 reactions — most reacted message of the week)
- kian shared a mini-book on RLVR: <https://rlvrbook.com>
- Percy Liang shared a [post](https://x.com/rosinality/status/2044664370064408597/photo/1) cc'ing Michael Ryan
