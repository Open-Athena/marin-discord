## <#1364827114670657616> — Ray→Iris Migration & Cluster Ops

Ray sunset is accelerating: romain [announced](https://marin-discord.pages.dev/#1354881461060243561/1490883542920593499) full migration by end of April, and [PR #4604](https://github.com/marin-community/marin/pull/4604) cuts Ray workers sharply. Tony [pushed back](https://marin-discord.pages.dev/#1364827114670657616/1491964103458160710) asking for more runway on a paper-bound SFT branch. Central2 needed [multiple](https://marin-discord.pages.dev/#1364827114670657616/1490685421896728737) [restarts](https://marin-discord.pages.dev/#1364827114670657616/1491277244394377298); Russell [shipped a scheduler fix](https://marin-discord.pages.dev/#1364827114670657616/1491821391169847497) for users with many unschedulable tasks, and rohithck [called the Iris dashboard](https://marin-discord.pages.dev/#1364827114670657616/1492777063168348160) "a breath of fresh air". BATCH priority remains untested but on offer for guinea pigs.

## <#1364827114670657616> — GCS Storage Cleanup ($60k/mo)

Russell [pegged real cost](https://marin-discord.pages.dev/#1364827114670657616/1490767485547319388) at ~$60k/month, mostly standard-class checkpoints. Plan: enable 3-day soft-delete, then delete anything old not on David's protect list — [deletion ran](https://marin-discord.pages.dev/#1364827114670657616/1491499926465548368) and [completed](https://marin-discord.pages.dev/#1364827114670657616/1491518463288807484) on Apr 8. willheld [noted](https://marin-discord.pages.dev/#1364827114670657616/1490858115699310694) that default training paths now only keep final checkpoints permanently. Russell also [reminded sweepers](https://marin-discord.pages.dev/#1364827114670657616/1490895384229183558) to use new block-shuffle to cut class-B op costs.

## <#1364827114670657616> — Tokenization & Scheduling Pain

willheld's tokenization job [stuck at 4999/5000](https://marin-discord.pages.dev/#1364827114670657616/1491853650711281715) held v5p-8s and kept [thousands of workers alive](https://marin-discord.pages.dev/#1364827114670657616/1491854338346451054) despite only 23 real shards — zephyr discovers completed shards only during the work phase. Filed [#4575](https://github.com/marin-community/marin/issues/4575), [#4577](https://github.com/marin-community/marin/issues/4577), [#4578](https://github.com/marin-community/marin/issues/4578). Ahmed asked [how CPU-only jobs block TPU users](https://marin-discord.pages.dev/#1364827114670657616/1491858808052514898) — answer: Iris won't evict for larger slices unless you're BATCH priority. rohithck also filed [#4494](https://github.com/marin-community/marin/issues/4494) on actor-name clashes during retries.

## <#1365044508546568372> — MoE Progress

Pranshu's [Latent MoE results](https://github.com/marin-community/marin/issues/4032) at 1e19 show meaningful bpb hits at d768/d1024 and ~1% worse at d1536; Larry [is skeptical](https://marin-discord.pages.dev/#1365044508546568372/1490787661223559168) given d1536 is undertrained and 2% bpb on d1024 costs ~15% training time. Larry's [PR #4636](https://github.com/marin-community/marin/pull/4636) syncs grug MoE with main and posts a [metrics leaderboard](https://github.com/marin-community/marin/blob/c3331251266d7229f8cd0871a4bbd0499faad89c/experiments/grug/moe/README.md) to climb. chloe [offered](https://marin-discord.pages.dev/#1365044508546568372/1493002736633909348) to run grug-vs-megatron on H100 for issue #4283.

## <#1368297424086499359> — SWE-ZERO & Data Curation

Kevin Xiang Li [shipped SWE-ZERO](https://marin-discord.pages.dev/#1368297424086499359/1492293100058706011) in Marin: [1000 trajectories](https://huggingface.co/datasets/AlienKevin/SWE-ZERO-1k-trajectories) across 10 SWE-rebench repos with 87.4% unique bash commands under Jaccard 0.5. Complements willheld's [Code World Model rollouts](https://github.com/marin-community/marin/issues/4383). Percy [weighed in](https://marin-discord.pages.dev/#1368297424086499359/1492038961562910811) on the BeyondWeb-style rephrasing paper: take ideas but adapt — "we don't have infinite compute in Marin".

## <#1462895580064911522> — Data Mixing Scaling

yurusankyo [locked in functional form](https://marin-discord.pages.dev/#1462895580064911522/1492804983505289368) and is scaling up. Predicted [optimal mixtures are sparser](https://marin-discord.pages.dev/#1462895580064911522/1492805735552389201), often dropping low-quality splits entirely; the model is now good enough to [remove the convex-hull regularization](https://marin-discord.pages.dev/#1462895580064911522/1492806415067385966). Noise floor ~0.0014 BPB (10 seeds, same mixture).

## <#1355318637854199848> — SFT & Online Distillation

Ahmed surfaced [distillation work](https://marin-discord.pages.dev/#1355318637854199848/1493005523744854108) that caught willheld's eye: online distillation is his [#1 desired RL feature](https://marin-discord.pages.dev/#1355318637854199848/1493005668666441800) for Marin. nato [asked](https://marin-discord.pages.dev/#1355318637854199848/1493007434153852979) whether tinker supports distillation yet as a starting point for a fully-open distilled model.

## <#1365058937589858324> — Code Reviews

Ahmed opened [PR #4637](https://github.com/marin-community/marin/pull/4637) adding LoRA to DPO (and reviving LoRA generally), with dlwh-flavored refactoring for review. willheld's [PR #4600](https://github.com/marin-community/marin/pull/4600) ports native Llama whitespace protection. Russell's [PR #4629](https://github.com/marin-community/marin/pull/4629) improves task info.

## <#1364827114670657616> — JAX 0.9.2 Migration Scoping

romain is [scoping the upgrade](https://marin-discord.pages.dev/#1364827114670657616/1490787265213894908) on top of Ahmed's vllm/tup work on the `tpu-dep-hell` branch. Pranshu confirmed his [earlier revert](https://marin-discord.pages.dev/#1364827114670657616/1490789076595376311) was due to a Mixtral 8x7B MFU regression in Levanter, not a real break. Plan: benchmark training perf (Ahmed was mostly focused on inference) and dispatch codex.

## <#1357057383830126652> — New Members

Vivien Cheng (Stanford MS, incoming PhD, Hazy Research — ML systems / kernels / linear attention), Ty Feng (TRC grant holder, RL infra, wants docs for solo TRC setup), Chris (Imperial maths, robotics→foundation models), and Sri (theoretical scaling/distributed, tinkering on M1).

## News & Research

- [Introducing Muse Spark](https://ai.meta.com/blog/introducing-muse-spark-msl/) (Meta MSL) — shared by Kaiyue-Wen
- [Paper from Tristan](https://arxiv.org/abs/2604.08423) — willheld notes it rewards finding differentiable proxies to agentic tasks
- PathMoE ([thread](https://x.com/askalphaxiv/status/2039400773105090619)) — shared router weights across consecutive layer blocks, tested to 16B
- Long-context synthetic data [paper with Percy](https://arxiv.org/abs/2603.18534v1) — elie asks if Marin will adopt
- [adamlsteinl post](https://x.com/adamlsteinl/status/2042655187613995026)
