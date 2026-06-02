## <#1462895580064911522> — Data Mixing Swarm Analysis & Interactive Viewer

willheld and yurusankyo deep-dove into swarm analysis this week. willheld noticed mix orderings stabilize after ~10% of a run, but yurusankyo showed early Spearman correlations with final rankings are only 0.2–0.3, [killing the idea of short proxy runs](https://discord.com/channels/1354881461060243556/1462895580064911522/1509275330228125777). yurusankyo also analyzed the [Poolside tech report's AutoMixer](https://discord.com/channels/1354881461060243556/1462895580064911522/1509342046941347921), noting key details were omitted but commonsense tradeoffs align with Marin's findings.

willheld built an [interactive web viewer](https://williamheld.com/wandb-analysis/) for exploring data mix tradeoffs, iterated on it across the week to add DSP-driven predictions, confidence intervals, and gradient-based steering from benchmark targets to mix adjustments. Percy Liang called the tool "very cool" but noted [jumpiness in individual benchmark scores](https://discord.com/channels/1354881461060243556/1462895580064911522/1509427898245976114). willheld and yurusankyo discussed the non-convex optimization landscape of the DSP functional form.

A key finding: there is [no free data mixing lunch](https://discord.com/channels/1354881461060243556/1462895580064911522/1509701917662773320) — HellaSwag and Paloma macro BPB are maximized by proportional mixing, so any "optimal" mix involves explicit tradeoffs. yurusankyo [confirmed](https://discord.com/channels/1354881461060243556/1462895580064911522/1509836406615310429) that quality should not be modeled as a scalar discount factor after testing high-quality upweighting interventions. willheld pre-registered a mix targeting HumanEval/GSM8K/MMLU in [issue #6063](https://github.com/marin-community/marin/issues/6063). Percy Liang asked about [expanding to 180+ evals](https://discord.com/channels/1354881461060243556/1462895580064911522/1509955161437638839) for richer signal.

## <#1364827114670657616> — Infrastructure & Scheduling

Larry posted a [detailed analysis](https://github.com/marin-community/marin/issues/5942) of batch scheduling on v5p-8, finding jobs get preempted ~32 times in 3 days and only make progress ~1/9 of the time. His [main conclusion](https://discord.com/channels/1354881461060243556/1364827114670657616/1508661610951082136): jobs need tighter checkpoint intervals, and scheduling policies could reduce thrashing. Russell Power rolled out a new reconcile-based scheduler and acknowledged the issue, suggesting minimum scheduling quanta for batch.

willheld submitted [PR #5953](https://github.com/marin-community/marin/pull/5953) to let the controller use reserved compute for smaller slices. Al (@alxrms) began onboarding to Iris/Zephyr, working through documentation gaps and proposing a [SQL data loading integration](https://github.com/marin-community/marin/pull/5861) and a potential [Cubed integration](https://discord.com/channels/1354881461060243556/1364827114670657616/1509628529963438355) for preemption-resilient array operations. Benjamin Feuer asked about [standing up HTTP endpoints over multi-host JAX meshes](https://discord.com/channels/1354881461060243556/1364827114670657616/1509303155437998292). Ahmed M Ahmed hit auth issues after cluster changes, resolved by re-running `gcloud auth application-default login`.

## <#1441211384279994529> — Deduplication Results

rav shared [results from the latest dedup run](https://discord.com/channels/1354881461060243556/1441211384279994529/1508887247796178985): 15B input docs (~15T tokens without FineTranslations) reduced to ~12T tokens after deduplication. Doc-level decontamination removed ~0.04% (6M elements) with suspected false positives. rav also flagged a [Poolside report finding](https://discord.com/channels/1354881461060243556/1441211384279994529/1509334821732880444) that snapshot-level fuzzy dedup outperforms global dedup on knowledge benchmarks because cross-snapshot duplicates tend to contain relevant facts.

## <#1368297424086499359> — Data Curation & Format Robustness

dlwh proposed [injecting more variation at the HTML-to-text stage](https://discord.com/channels/1354881461060243556/1368297424086499359/1509063908894310520) during pretraining, citing Marin 8B's sensitivity to newline patterns and HTML artifacts like `&gt;`. The idea draws from [Prompt Template Sensitivity in LM Evaluation](https://arxiv.org/pdf/2504.06969) but extends to data processing. Percy Liang noted that [Michael Ryan's spec-driven work](https://discord.com/channels/1354881461060243556/1368297424086499359/1509184548569874643) could generate multiple text renderings per HTML document, though cost is a concern. dlwh ultimately [pivoted](https://discord.com/channels/1354881461060243556/1368297424086499359/1509224574406098975) to thinking the priority is reformatting FLAN examples.

## <#1399998407657001062> — GPU MoE Performance

dlwh reported [MoE routing performance issues](https://discord.com/channels/1354881461060243556/1399998407657001062/1509673631758946508) when scaling to B200s. At d5120/L8, Grug (the in-house implementation) drops to 14–24k tok/s vs Megatron's 91.6k tok/s, a [dramatic reversal from d1024 where Grug was faster](https://discord.com/channels/1354881461060243556/1399998407657001062/1509715606709211136). The issue appears addressable but highlights scaling challenges in custom MoE routing.

## <#1357057383830126652> — Community Growth & Introductions

The server saw ~90 new joins this week, with notable introductions including HypnoPump17 (founding engineer at Poolside), V. (ex-Anthropic pretraining/RL), allie (ex-xAI RL posttraining), Rabrg (ex-OpenAI, using Delphi models), Tim Tsz-Kit Lau (DRW, sharing work on [symmetric-compatible optimizers](https://arxiv.org/abs/2605.18106)), shahir (Stanford PhD exploring novel architectures on Marin), and leenacvankadara (UCL Gatsby Unit, MoE scaling theory).

## <#1356487738840318002> — Evals

Percy Liang [asked](https://discord.com/channels/1354881461060243556/1356487738840318002/1509803902638362625) dlwh, willheld, and Benjamin Feuer to identify eval tasks for Nikil Ravi to help with. dlwh identified a [real gap in code interpretation evals](https://discord.com/channels/1354881461060243556/1356487738840318002/1510338914076987474) via the perplexity gap analysis. In <#1354881461060243561>, Rabrg [reported](https://discord.com/channels/1354881461060243556/1354881461060243561/1509285401905332294) that the largest Delphi checkpoint (1e23, 25B params) has drastically off-trend NLL, shared a [repro script](https://gist.github.com/Rabrg/e33b7ef7c91ba838fee5ba8b8b44d6e4).

## <#1484315476325826660> — RL Stack & OT-Agent

Benjamin Feuer [asked who owns the Marin RL stack](https://discord.com/channels/1354881461060243556/1364827114670657616/1509597879214543031), with dlwh noting [nobody really owns it at the moment](https://discord.com/channels/1354881461060243556/1364827114670657616/1509597879214543031). Sankalp Jajee [volunteered](https://discord.com/channels/1354881461060243556/1484315476325826660/1509519957430636579) to continue OT-Agent development.

## News & Research

- Larry shared the [Poolside Laguna M1 tech report](https://poolside.ai/assets/laguna/laguna-m1-xs2-technical-report.pdf), noting their LR transfer formula and swarm-based data mixing approach closely mirror Marin's — [discussed extensively](https://discord.com/channels/1354881461060243556/1356487690559684638/1508858469732581519) across channels
- Kaiyue-Wen shared [Ultra-FineWeb-L3](https://huggingface.co/datasets/openbmb/Ultra-FineWeb-L3); Percy Liang [suggested adding it to the next data mix](https://discord.com/channels/1354881461060243556/1356487690559684638/1509805466971148328) and proposed naming the current dataset ("marin-data-0.1"?)
- willheld shared [FuzzX](https://github.com/SemiAnalysisAI/FuzzX) from SemiAnalysis for finding miscompiles, and an arxiv paper on [data mixing](https://arxiv.org/abs/2605.26494)
- leenacvankadara shared [How to Scale Mixture-of-Experts: From μP to the Maximally Scale-Stable Parameterization](https://arxiv.org/abs/2605.14200), showing μP falls short for MoEs when scaling expert count
- Matheart shared a [blog post on generalization dynamics oscillations](https://jiaxin-wen.github.io/blog/generalization-dynamics.html) with surprising control experiment results
- dlwh set up an [MCP-based chat server for inter-agent communication](https://discord.com/channels/1354881461060243556/1366632114316906506/1510160115490357339) to stop manually ferrying context between coding sessions
