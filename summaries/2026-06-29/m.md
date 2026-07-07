## <#1483266366772351067> — 1e23 Midtraining & Contamination Discovery

Benjamin Feuer [launched the 1e23 midtraining run](https://discord.com/channels/1354881461060243556/1483266366772351067/1521281657519214777) on v5p-64 pre-emptible TPUs, reporting 57% MFU (>75% nominal). The run uses the Nemotron CC Math mix scaled up from the 1e22 ladder. Ahmed M Ahmed flagged that the Nemotron CC Math dataset has significant contamination issues — a [shuffled val set led to ~19% loss mismatch](https://discord.com/channels/1354881461060243556/1483266366772351067/1521288527529246893) which dropped to 3% after proper decontamination using rav's tooling. Ahmed published an [HTML report](https://ahmeda14960.github.io/delphi-midtraining/dossier.html) documenting the findings and is tracking work in [issue #6742](https://github.com/marin-community/marin/issues/6742).

Later in the week, Ahmed ran deeper contamination analysis and found [28% of Math500 has 10-gram overlap](https://discord.com/channels/1354881461060243556/1483266366772351067/1523154815599902791) with Nemotron CC Math — despite Nemotron claiming explicit dedup against these benchmarks. GSM8K was mostly clean (~2.4% overlap), and the SFT data (Magpie-Pro-300K-Filtered) showed [no contamination](https://discord.com/channels/1354881461060243556/1483266366772351067/1523195677755314336). rohithck suggested running downscaled token budgets on the 1e23 to validate eval forecasting from smaller models.

## <#1365058937589858324> — Executor → Named Artifacts Refactor

Russell Power [merged a major refactor](https://discord.com/channels/1354881461060243556/1365058937589858324/1521610328088252446) replacing executor's content-addressed hashing with explicit named versions. The old system silently forked output paths on any code change; the new approach makes version names explicit with advisory hashes. rohithck raised backward-compatibility concerns for his downstream scaling eval pipelines, and Russell pointed to `read_artifact` / `.adopt` for recovering old paths, or using the [thalas repo](https://github.com/marin-community/thalas/) as a standalone executor dependency. Additional PRs included [dataset module reorganization](https://github.com/marin-community/marin/pull/6797), [checkpoint writing under /user dir](https://github.com/marin-community/marin/pull/6790), a [public_artifacts design](https://github.com/marin-community/marin/pull/6816) for durable HTML hosting, and a [mixing_via_embeddings design](https://github.com/marin-community/marin/pull/6969) for bucket-independent mixture surrogates.

## <#1364827114670657616> — Infra: GPU Scheduling, Iris, & TPU Woes

romain bumped the transformers package from 4.57.5 to 5.12.1 (major version change). dlwh raised [issue #6690](https://github.com/marin-community/marin/issues/6690) about JAX recommending 1 process per GPU, which conflicts with current scheduling — Russell suggested a `splitgpu` wrapper in rigging as a [short-term solution](https://discord.com/channels/1354881461060243556/1364827114670657616/1521483968896041021). Larry flagged that Iris's 2-week branch staleness check forces rebasing during hero runs; Russell [pointed to the version constant](https://discord.com/channels/1354881461060243556/1364827114670657616/1521677924573380739) as a quick workaround. Some apparent TPU instability hit mid-week, prompting jokes about [angering the TPU gods](https://discord.com/channels/1354881461060243556/1364827114670657616/1522424242925338664).

## <#1462895580064911522> — Data Mixing: New Mix Eval Results & Query Infrastructure

willheld published a [full speedup comparison table](https://discord.com/channels/1354881461060243556/1462895580064911522/1521595789783076985) across 111 evals comparing the new data mix, proportional pool mix, and old mix, with clickable scaling curves per task. Percy Liang asked about the "ns" superscript notation and permanence of the hosted HTML reports.

Separately, Russell and rav explored building an always-on SQL query service for rapid data exploration — Russell [suggested starting with a single-server DuckDB instance](https://discord.com/channels/1354881461060243556/1462895580064911522/1521220955031212112), and rav proposed two evaluation paths (single beefy node vs. distributed) with an Iris endpoint/dashboard, potentially nicknamed "smallquery." Cross-region access from Coreweave needs benchmarking. Russell also experimented with [replacing fasttext for quality bucketing](https://github.com/marin-community/marin/issues/6739#issuecomment-4833334278) but found models bottomed out and overfitted.

## <#1365044508546568372> — MoE: 67B-A2B Launch & Latent MoE

Larry [kicked off the 67B-A2B MoE](https://discord.com/channels/1354881461060243556/1365044508546568372/1521008406184460288) trained on 10T tokens with the new datamix, projected to take ~50 days. Early Paloma macro loss impressed dlwh — willheld attributed the improvement to Larry's architecture changes rather than the data mix. Larry shared [context on the model progression](https://discord.com/channels/1354881461060243556/1365044508546568372/1521726976120066048): from Delphi dense (1e22/1e23) → 129B-A15B MoE (1e23) → current 67B-A2B. At ~3% through training, the new model already approaches the previous MoE's final Paloma loss at ~3x better FLOP efficiency. dlwh [proposed revisiting latent MoE](https://discord.com/channels/1354881461060243556/1365044508546568372/1521936808550596758); Larry opened [issue #6822](https://github.com/marin-community/marin/issues/6822) noting it needs significant MFU gains to justify, possibly via higher granularity (8-of-512 vs 4-of-256).

## <#1516150256499163166> — MarinFold: Contact Prediction Breakthrough

Tim O'Donnell reported a [significant milestone](https://discord.com/channels/1354881461060243556/1516150256499163166/1521231463318818956): the best model from Eric's sweep achieved >0.4 R-precision on contact prediction across a 554-protein eval set, with an apparent phase change after ~23B training tokens. He posted the [July meeting schedule](https://discord.com/channels/1354881461060243556/1516150256499163166/1522676530470457414) with alternating office hours and project meetings.

## <#1356490712199462912> — Scaling Laws Papers

Benjamin Feuer shared a [new arxiv paper](https://discord.com/channels/1354881461060243556/1356490712199462912/1522216909473583104) on reshaping distributions for scaling. willheld noted it's similar to [Quanta](https://ericjmichaud.com/quanta/) (published only as a website), and suhasia linked the [original Quanta paper](https://arxiv.org/abs/2303.13506). willheld pointed out the new paper should have better distinguished its Pythia experiments from Quanta's prior work.

## <#1368297424086499359> — Data Curation: Graph-Based Approaches

Bilibird asked about graph-based curation approaches referencing recent papers. rav [filed issue #6750](https://github.com/marin-community/marin/issues/6750) to explore reconstructing link graphs for the document pool, noting it would require significant work. wumpus commented on the issue with details about currently published graph data. Benjamin Feuer welcomed Snorkel collaborators to the channel.

## <#1462896888000024711> — Data E2E Transform: Pulpie & Extraction Pipelines

dlwh shared [Pulpie](https://usefeyn.com/blog/pulpie-pareto-optimal-models-for-cleaning-the-web/), a new approach to joint extraction and curation. Michael Ryan found the paragraph-level keep/remove classification clever for efficiency and is [benchmarking it alongside AICC](https://arxiv.org/abs/2511.16397). He's also [distilling everything into a smaller pipeline](https://discord.com/channels/1354881461060243556/1462896888000024711/1522292109732872222) using a Claude-optimized fork of JustText.

## <#1354881461060243561> — Community: Meetings & Manifesto

Percy Liang [announced biweekly Marin community meetings](https://discord.com/channels/1354881461060243556/1354881461060243561/1521671804572401724) starting July 7 (22 reactions). dlwh [published a manifesto](https://discord.com/channels/1354881461060243556/1354881461060243561/1521206659375173722) on open development of frontier AI at <https://openathena.ai/blog/open-development-of-frontier-ai/>. All Discord channels were made visible by default.

## <#1399998407657001062> & <#1382240679765217342> — GPU Profiling & Optimizer Tuning

dlwh posted a [humorous GPU cost breakdown](https://discord.com/channels/1354881461060243556/1399998407657001062/1522370449311400036) showing all-gather dominating at $3,600 vs $200 for MoE compute on GPU runs. In optimizers, Larry advised Ahmed on [learning rate search strategy](https://discord.com/channels/1354881461060243556/1382240679765217342/1521602718400254052) for Hyperball, noting the need to recheck LR on the new datamix.

## <#1374989195109466122> & <#1356487738840318002> — RL & Evals

Benjamin Feuer shared close-out reports for [reasoning RL on Delphi](https://discord.com/channels/1354881461060243556/1374989195109466122/1521285492602048542) and [exploration-inducing RL ablations](https://discord.com/channels/1354881461060243556/1374989195109466122/1523287925654159360), and is working on [agentic eval parity on TPU](https://discord.com/channels/1354881461060243556/1356487738840318002/1523362280136380708).

## News & Research

- dlwh's Marin manifesto: [Open Development of Frontier AI](https://openathena.ai/blog/open-development-of-frontier-ai/)
- Benjamin Feuer announced the [OpenThoughts-Next kickoff](https://discord.com/channels/1354881461060243556/1356487690559684638/1521186176743112795) focusing on mid-training and RL for MoEs with Marin models
- willheld shared [Longcat 2.0](https://longcat.chat/blog/longcat-2.0/) — largest model with null experts
- [Pulpie: Pareto-Optimal Models for Cleaning the Web](https://usefeyn.com/blog/pulpie-pareto-optimal-models-for-cleaning-the-web/)
- [AICC](https://arxiv.org/abs/2511.16397) — AI-based content curation
- dlwh noted [ChatGPT's low opinion of Codex](https://discord.com/channels/1354881461060243556/1462884917292699669/1521181811957567499), and later caught what appeared to be leaked chain-of-thought from Codex
