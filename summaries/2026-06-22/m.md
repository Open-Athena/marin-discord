## <#1364827114670657616> — Infra & Executor Refactor

Russell Power [explored Tunix RL](https://discord.com/channels/1354881461060243556/1364827114670657616/1518612886077968495) on idle v6e TPUs over the weekend, trialing Delphi and Qwen 8B models. Key finding: running experiments outside the marin monorepo is painful due to agent reliance on in-repo docs — even basic getting-started docs would help. willheld [proposed burning down executor entirely](https://discord.com/channels/1354881461060243556/1364827114670657616/1519443077926748311), and Russell agreed the current system conflates "what" with "how" and the `default_*` pattern obscures experiments. dlwh [summarized the consensus](https://discord.com/channels/1354881461060243556/1364827114670657616/1519472190779555890): keep lock functionality, replace the DAG with `artifact.use`/`artifact.save`, replace `default_` with templates, and store global config info rather than full tracing. rav [endorsed](https://discord.com/channels/1354881461060243556/1364827114670657616/1519501137731129560) using artifact machinery at component boundaries.

On ops: Russell updated `iris.oa.dev` to point at a GCLB proxy, fixed a [zephyr worker environment inheritance bug](https://github.com/marin-community/marin/issues/6678) reported by rohithck, and [adjusted Iris priority](https://discord.com/channels/1354881461060243556/1364827114670657616/1519823588847386699) so jobs won't be scheduled below CoreWeave NHC health checks after Benjamin Feuer's jobs were getting killed. HF storage warnings at 95% capacity are non-critical — just pay-as-you-go overflow.

## <#1365058937589858324> — Code Review & Experiment Cleanup

Russell opened a [large experiment cull PR (#6633)](https://github.com/marin-community/marin/pull/6633) to clean up accumulated cruft before adjusting executor behavior. willheld [agreed to the cull](https://discord.com/channels/1354881461060243556/1365058937589858324/1519443294126604328) but emphasized keeping ~10 template experiments as API-surface "expect tests" — e.g., Delphi should survive not as "how we ran Delphi" but as "how to use Executor to train models, fit a scaling law, and train a bigger model." Russell also opened [PR #6624](https://github.com/marin-community/marin/pull/6624) to enforce executor behavior and [PR #6621](https://github.com/marin-community/marin/pull/6621) for customizable Docker environment privileges (useful for sandboxes). Two design docs landed via marin-bot: [multi-backend Iris (#6718)](https://github.com/marin-community/marin/pull/6718) enabling one controller to front GCP TPU + multiple CoreWeave clusters, and [lazy artifacts replacing executor (#6649)](https://github.com/marin-community/marin/pull/6649) with `name@version` artifacts and a build-once registry.

## <#1356490712199462912> — Scaling Laws

Ahmed M Ahmed and willheld discussed hyperparameter tuning for scaling law experiments. Ahmed reported [120 Vizier runs](https://discord.com/channels/1354881461060243556/1356490712199462912/1520217019436498984) improved R² from 0.75 to 0.978 at 3e20 compute with no divergent runs, by tuning lr, adam_lr, and epsilon while keeping betas fixed (beta2 at 0.9999). willheld noted beta1 is [surprisingly insensitive](https://discord.com/channels/1354881461060243556/1356490712199462912/1520217135736029215) (possibly an AdamH property) while beta2 is mainly sensitive to being too low. They discussed step count differences between reference (2^16) and Delphi (2^15) — no strong reason for the difference; more steps gives marginally lower loss if beta is tuned accordingly per [this paper](https://arxiv.org/abs/2507.07101). Ahmed is planning 1e21 and 1e22 runs next.

## <#1374989195109466122> — Reinforcement Learning

marianna13 [shared a clean 8B fixthink run](https://discord.com/channels/1354881461060243556/1374989195109466122/1518700249902743773) reaching 35% on SWE-bench (mean@2), achieved by filtering r2egym tasks by base p@8 performance, aligning instruction formats, and introducing in-distribution eval. TheDeviousPanda was [onboarded](https://discord.com/channels/1354881461060243556/1374989195109466122/1519647004744093777) by Benjamin Feuer and asked about MFU benchmarks and repro experiments. ixh [shared the team's RL infra strategy](https://discord.com/channels/1354881461060243556/1374989195109466122/1520132015213772941): the SkyRL fork is the primary path forward (romain + Benjamin Feuer), Russell will continue exploring alternatives (Tunix, NeMo-Skills), and a broader JAX-based RL solution is a longer-term goal. Russell also [listed open issues](https://discord.com/channels/1354881461060243556/1374989195109466122/1520078524155826307) for GPU kernel work including B200 FA4/CuTe attention and MoE dispatch optimization.

## <#1399998407657001062> — GPU Performance

dlwh [built a profiling dashboard](https://discord.com/channels/1354881461060243556/1399998407657001062/1518855948100177991) for a 2-node GPU run revealing Muon takes ~500ms of 1500ms step time, and EP has high overhead from the naive ring all-gather path. After the OA meeting, dlwh [posted the outcome](https://discord.com/channels/1354881461060243556/1399998407657001062/1520200189690773564): currently at ~19.9% MFU on 4 nodes with SGD/Adam, Muon is being dropped (10% step-count improvement not worth the overhead), and they're targeting a fused Pallas kernel for MoE MLP. Russell [reported](https://discord.com/channels/1354881461060243556/1399998407657001062/1520210967579853022) that pipeline parallelism experiments (1F1B and zero-bubble) couldn't beat FSDP.

## <#1462895580064911522> — Data Mixing

willheld [shared scaling curves](https://discord.com/channels/1354881461060243556/1462895580064911522/1519758109411639417) comparing optimized data mixtures vs. proportional mixing at compute-optimal settings, noting the mix was optimized for 100X overtrained (a weak setting). Comparisons against the old data mix show [gains dominated by code & arxiv](https://discord.com/channels/1354881461060243556/1462895580064911522/1520123383138750595). Scaling curves on "the big three" pretraining evals show [potential crossovers](https://discord.com/channels/1354881461060243556/1462895580064911522/1520176931876638861) that need larger scale to confirm. Percy Liang [noted](https://discord.com/channels/1354881461060243556/1462895580064911522/1520251536045768826) crossovers are exciting and asked about generating all evals.

## <#1500987824206254120> — Tokenizer

Pranshu Chaturvedi [shared results](https://discord.com/channels/1354881461060243556/1500987824206254120/1518833184391958548) on numeric pre-tokenization experiments, testing right-to-left encoding, place-aligned digits, and capping digit strings at 510 to avoid pathological regex. Using 262k tokenizers trained on 50B corpus and truncated to 8k/32k vocab sizes with GrugMoE models, OSS tokenizer [benefits from the new numeric logic but Llama does not](https://discord.com/channels/1354881461060243556/1500987824206254120/1518833471449989170). Bilibird expressed interest in studying pre-tokenization stage impacts.

## <#1462884917292699669> — Automating Research

yurusankyo [discussed multi-agent orchestration](https://discord.com/channels/1354881461060243556/1462884917292699669/1518498158076760225) as a big opportunity (echoing Kevin Xiang Li) and shared [Fieldbook](https://github.com/Calvin-Xu/Fieldbook), a vibecoded sqlite ledger for tracking experiments across agent sessions. Currently uses one Codex session and switches between experiments to hide latency, but no true parallel agent compute yet.

## <#1354881461060243561> — Baby Marin Model Demo

Benjamin Feuer [stood up the first public Marin model](https://discord.com/channels/1354881461060243556/1354881461060243561/1519036911740522688) — a "very preliminary and tiny" Delphi model at a pinggy endpoint for community vibe testing. Tim O'Donnell found it responsive but with "truthy" rather than insightful outputs. Russell noted [EOS issues for coding](https://discord.com/channels/1354881461060243556/1354881461060243561/1519076038355845211) and missing spaces in import statements. ma08 found [promising system prompt adherence](https://discord.com/channels/1354881461060243556/1354881461060243561/1519087428013392013) on first try though it could be overridden.

## <#1516150256499163166> — MarinFold

Tim O'Donnell posted a [weekly update](https://discord.com/channels/1354881461060243556/1516150256499163166/1518688580581458250): Eric Czech's hyperparameter sweep ([#61](https://github.com/Open-Athena/MarinFold/issues/61)) produced significantly better models than the quick-and-dirty baseline. The key insight: [stratifying by sequence identity](https://discord.com/channels/1354881461060243556/1516150256499163166/1520077768807678135) reveals MarinFold can fold proteins very far from the training set where KNN has zero performance, while KNN actually outperforms MarinFold on highly similar proteins. This suggests MarinFold has learned generalizable folding principles beyond memorization, and there's low-hanging fruit for improvement.

## <#1368297424086499359> — Data Curation

willheld [built a data viewer](https://discord.com/channels/1354881461060243556/1368297424086499359/1519479643030290663) for rav's data filter at <https://oa.williamheld.com/quality_viewer_nemotron.html>. rav shared two papers: one on [predictive data selection](https://arxiv.org/abs/2509.18577) and another on [data curation methods](https://arxiv.org/abs/2503.00808). wumpus shared [Hubs or Fringes: Pretraining Data Selection via Web Graph Centrality](https://arxiv.org/pdf/2606.11499), prompting Jeff H to ask about adding this feature. wumpus [noted](https://discord.com/channels/1354881461060243556/1368297424086499359/1520930909644259428) they already use graph topology for crawl budgets but the hub/fringe idea could help surface interesting clusters.

## <#1365044508546568372> — MoE

dlwh [flagged seq-QB](https://discord.com/channels/1354881461060243556/1365044508546568372/1519928245431042099) (within-sequence balance forcing) for long context handling and MoE kernel benefits. Larry [noted](https://discord.com/channels/1354881461060243556/1365044508546568372/1519930661513728071) it builds on QB v2 which doesn't enforce top-k per token, and later confirmed it also addresses topK QB (what Marin currently uses).

## <#1382240679765217342> — Optimizers

Ahmed M Ahmed [asked Larry](https://discord.com/channels/1354881461060243556/1382240679765217342/1520138542406439143) about HP tuning for Muon, noting that Delphi beta values transferred well to his DCLM dense model scaling ladder. Larry [explained](https://discord.com/channels/1354881461060243556/1382240679765217342/1520675022354513991) beta2 is floored at 0.95 (not optimal but safe), and that momentum/beta1 serve different roles than simply scaling batch size — they help estimate gradients that extrapolate well for the full step size.

## <#1436412621040648222> — DSPy & RL Bootstrapping

willheld [found](https://discord.com/channels/1354881461060243556/1436412621040648222/1520172887133257779) that running GEPA (DSPy prompt optimization) on the largest Delphi model was enough to bootstrap RL learning, whereas RL alone with a standard prompt produced no signal due to initial reward being too low.

## <#1357769641132298321> — Experiments

Russell [tested adaptive sparsity curriculum](https://discord.com/channels/1354881461060243556/1357769641132298321/1518580389571067936) for MoE — starting from 0.1% activation and gradually increasing k during training. [Results](https://github.com/rjpower/marin-experiments/blob/main/adaptive-sparsity/REPORT.md#result-4-the-k-curriculum-does-not-pay-off): it does not recover full-density MoE performance. The motivation was exploring whether you could get a realistically-sized model into shape quickly for testing data mixtures or optimizers.

## News & Research
- [OpenThoughts-Agent](https://huggingface.co/papers/2606.24855) — open data recipes for post-training robust generalist agents (9 reactions, congrats to Benjamin Feuer and team)
- willheld shared a [paper on scaling](https://arxiv.org/abs/2510.01624)
- rav shared a [paper on data selection](https://arxiv.org/abs/2601.06911)
- [Hubs or Fringes](https://arxiv.org/pdf/2606.11499) — pretraining data selection via web graph centrality
- [Predictive Data Selection](https://arxiv.org/abs/2509.18577) and [another data curation paper](https://arxiv.org/abs/2503.00808)
- Seq-QB discussion referencing [Jianlin Su's thread](https://x.com/Jianlin_S/status/2057719868917793221)
- New community members: jorl (TU Munich, particle physics), Jacob Silterra (comp bio → ML), zaza (NYU, post-training/safety), Yuexing Hao (MIT PostDoc), Xiaomin Li (Microsoft CoreAI, coding LLMs)
