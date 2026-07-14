## <#1364827114670657616> — Infra & Cluster Operations

The 67B-A2B hero run [crashed on July 6](https://discord.com/channels/1354881461060243556/1364827114670657616/1523698536921825310) due to a port conflict (another process holding port 8431); Russell Power quickly diagnosed it and [cleared competing tasks on the v4s](https://discord.com/channels/1354881461060243556/1364827114670657616/1523705047756701736) to get it running again. Russell also pointed Larry to [PR #6924](https://github.com/marin-community/marin/pull/6924) for a memory leak fix. The cluster was restarted for updates, and a [finelog display bug](https://discord.com/channels/1354881461060243556/1364827114670657616/1524809052335636632) was fixed the same day.

Larry encountered a [DEADLINE_EXCEEDED barrier timeout](https://discord.com/channels/1354881461060243556/1364827114670657616/1524445123520368650) on the 67B-A2B restart (90/256 tasks reached barrier); dlwh suggested deleting and recreating the full 2048 node pool. Later in the week, [suspicious preemptions](https://discord.com/channels/1354881461060243556/1364827114670657616/1524927862455406785) hit the reserved v4-2048 but resolved quickly.

rohithck hit Iris job submission failures due to `pr_reviews.db` inflating bundle size; Russell Power [acknowledged it shouldn't have been checked in](https://discord.com/channels/1354881461060243556/1364827114670657616/1524770736374550618) but was reluctant to rewrite git history. rohithck also reported [uv lock timeouts](https://discord.com/channels/1354881461060243556/1364827114670657616/1525035072414023750) when spinning up parallel vLLM workers. Benjamin Feuer flagged that [Levanter shows ~2x worse MFU](https://discord.com/channels/1354881461060243556/1364827114670657616/1526011060451021034) than Llama-Factory on A100s in identical SFT runs.

## <#1500987824206254120> — Tokenizer Selection

willheld [made a strong case](https://discord.com/channels/1354881461060243556/1500987824206254120/1523811733968388298) for adopting the GPT-OSS tokenizer, citing two main reasons: (1) rohithck's pass@K forecasting method is easier with matching tokenizers, and (2) OPD (online policy distillation) benefits from teacher-student tokenizer alignment. He also suggested [GLM 5.2's tokenizer](https://discord.com/channels/1354881461060243556/1500987824206254120/1523813155287859343) as an alternative for agentic tasks, and noted that Nemotron & Mistral use a [drop-in Llama replacement tokenizer](https://discord.com/channels/1354881461060243556/1500987824206254120/1523853396795330560).

Percy Liang [asked about cross-tokenizer compatibility](https://discord.com/channels/1354881461060243556/1500987824206254120/1524277552074723368); rohithck [confirmed ~98%+ one-to-one token mapping](https://discord.com/channels/1354881461060243556/1500987824206254120/1524293725944021073) between Llama and Qwen for regular text, though math/code may differ. Bilibird mentioned SimCT as a potential cross-tokenizer OPD solution and shared [language-wise tokenizer performance comparisons](https://github.com/marin-community/marin/issues/5842). Russell Power shared early [tokenizer training experiments](https://github.com/marin-community/marin/issues/6796#issuecomment-4889273144) from GPU cluster burn-in, noting no big lift from SuperBPT vs Llama. Pranshu Chaturvedi [reported a bug](https://discord.com/channels/1354881461060243556/1500987824206254120/1525252850408620142) in digit tokenization experiments where wrong model sizes were passed, requiring reruns.

## <#1516150256499163166> — MarinFold

Tim O'Donnell posted a [detailed weekly update](https://discord.com/channels/1354881461060243556/1516150256499163166/1523748740131848202) on MarinFold's progress toward post-training via rejection fine-tuning (RFT). In [exp98](https://github.com/Open-Athena/MarinFold/tree/main/experiments/exp98_data_generate_rollouts_contacts_v1_train), best-of-N accuracy (F1) scaled from 0.12 to 0.34 as N went from 1 to 1000 across 1M rollouts. [Exp100](https://github.com/Open-Athena/MarinFold/issues/100) explores constrained decoding to generate perfectly accurate rollouts more cheaply.

A new **contacts-and-coordinates-v1** document format was specced ([#104](https://github.com/Open-Athena/MarinFold/pull/104)) to explore 3D coordinate prediction, with training data generation started in [#105](https://github.com/Open-Athena/MarinFold/issues/105). Contacts-v1 inference was added to the CLI ([#92](https://github.com/Open-Athena/MarinFold/pull/92)). Tim will be on vacation until July 15; next meeting is Wed 7/15 at 3:30pm ET.

## <#1356490712199462912> — Scaling Laws & Compute Optimality

Ahmed M Ahmed [raised questions](https://discord.com/channels/1354881461060243556/1356490712199462912/1524835963438629036) about Delphi scaling law design choices — why D* is fitted rather than N*, and why model configs skew overtrained rather than undertrained.

willheld kicked off a [substantial discussion](https://discord.com/channels/1354881461060243556/1356490712199462912/1524915671555899403) on redefining "compute optimal" for an RL world. His key insight: if a pretrained model's pass@256 can be converted to pass@1 via RL, then compute optimality should be measured against pass@256 on agent-relevant skills rather than pretraining loss. He noted that [5x overtraining costs only ~3x more compute](https://discord.com/channels/1354881461060243556/1356490712199462912/1524921098574102598) for the same pretraining loss in Delphi, and the 5x post-training speedup likely makes it worthwhile. Ahmed [introduced nick11roberts](https://discord.com/channels/1354881461060243556/1356490712199462912/1525151508553924649), lead author of T², who expressed interest in joint pre-and-post training scaling work.

## <#1365044508546568372> — MoE Hero Run

The 67B-A2B MoE hero run on 10T tokens progressed through its first cooldown. Larry noted an [unexplained step time increase](https://discord.com/channels/1354881461060243556/1365044508546568372/1524094018928115902) from 26s to 30s around step 32k. At 2T tokens (20% into run), the [first early cooldown began](https://discord.com/channels/1354881461060243556/1365044508546568372/1525009152290586686) with a swap to datamix-phase2 and seqlen increase from 8k to 65k, causing a 30% decrease in tokens/sec due to quadratic attention cost. The [W&B report](https://wandb.ai/marin-community/marin_moe/reports/67B-A2B-MoE-on-10T-tokens--VmlldzoxNzM1OTMxMQ) tracks progress. willheld asked whether this cooldown could [beat the 32B model's lowest-ever loss of 2.202](https://discord.com/channels/1354881461060243556/1365044508546568372/1525307881535045632). By July 12, willheld confirmed the [first cooldown completed](https://discord.com/channels/1354881461060243556/1365044508546568372/1525959287329783859). Updated data appears to help significantly on code evals vs. Mantis cooldown.

## <#1366632114316906506> — Code & Eval Fixes

rohithck flagged [lm-eval issues](https://github.com/marin-community/marin/issues/7004) after the datasets library update; romain [fixed GSM8K grading](https://discord.com/channels/1354881461060243556/1366632114316906506/1524089011222610015) quickly. rohithck also reported [inference failures on v4-8s](https://github.com/marin-community/marin/issues/7085), which romain resolved with [RPA v3 support for TPU v4](https://discord.com/channels/1354881461060243556/1366632114316906506/1525169761955221525) in the tpu-inference fork.

## <#1399998407657001062> — GPU Kernels & MFU

dlwh has been building a [fused expert-parallel kernel](https://discord.com/channels/1354881461060243556/1399998407657001062/1523768306526322789) inspired by [SonicMoE](https://arxiv.org/pdf/2512.14080) (extended for EP), showing promise for overlapping all-gathers on NVLink ([#6597](https://github.com/marin-community/marin/issues/6597)). willheld opened a [B200 MFU tracking issue](https://github.com/marin-community/marin/issues/7012), aiming to match Larry's H200 single-rack numbers, potentially using Tri's Blackwell SonicMoE kernel. dlwh reported that [Codex is making good progress on jaxpp](https://discord.com/channels/1354881461060243556/1399998407657001062/1525217063830949888), putting Hopper back on the menu.

## <#1354881461060243561> — Community & Onboarding

The **first Marin community meeting** was held on July 7, with Percy Liang sharing [his slides](https://docs.google.com/presentation/d/1BsojyhAC0ueklVkvMKnMuoUrJrBEA3pG5_EL78H3LeU/edit?slide=id.p#slide=id.p) — [the announcement](https://discord.com/channels/1354881461060243556/1354881461060243561/1524112017265262793) received 8 reactions. The meeting was recorded. ~30 new members joined via #welcome-room throughout the week. Notable new introductions include Jose (self-taught engineer doing CS336), Anmol Kabra (Cornell PhD, interning at Snorkel AI), and Daljeet Virdi (Diffuse Labs, RL environments).

## <#1462895580064911522> — Data Mixing & Curation

rav shared an RFC ([PR #7040](https://github.com/marin-community/marin/pull/7040)) with a [quality classifier report](https://storage.googleapis.com/marin-public/rav/quality-score-debugging/2026.07.10.1/index.html) and a [decontamination report](https://storage.googleapis.com/marin-public/rav/decon-100b-dffilter/2026.07.10/index.html) for the 100B dataset. Benjamin Feuer shared the [DataKit dashboard](https://oa.williamheld.com/datakit_). In <#1368297424086499359>, Benjamin asked Franziska Weindel and Reinhard Heckel to schedule the OT-Next data breakout meeting. Bhavishya surfaced [Test-Time Curricula for Targeted Reinforcement Learning](https://arxiv.org/pdf/2510.04786) as relevant to targeted data filtering and proposed a mini PoC.

## <#1374989195109466122> — RL & Midtraining

Benjamin Feuer confirmed [MarinSkyRL 131k RL on MoEs is plumbed on CoreWeave](https://discord.com/channels/1354881461060243556/1374989195109466122/1524748716190339122). romain asked whether vLLM's [native RL APIs](https://vllm.ai/blog/2026-05-28-native-rl-apis) would be needed for GrugMoE RL. Bilibird raised the question of whether compute might be better spent training teacher models for OPD distillation rather than direct MoE midtraining. In <#1483266366772351067>, Benjamin kicked off Delphi MoE midtraining on decontaminated math, and Larry shared [curiosities about the 67B-A2B 20% cooldown](https://discord.com/channels/1354881461060243556/1483266366772351067/1525374850053705760) from a pretraining perspective.

## <#1418673157585502370> — DNA & Bio

Gonzalo Benegas shared [VEP inference cost comparisons](https://github.com/Open-Athena/marin-dna/issues/354) and updated the [Mendelian leaderboard](https://openathena.ai/marin-dna/leaderboards/mendelian) with supervised linear probing results — their best model still outperforms Evo 2 by a wider margin, and linear probing fixes reverse scaling in missense variants. Later, [finetuning was found to match linear probing performance](https://discord.com/channels/1354881461060243556/1418673157585502370/1525165863651512411) on this task ([#369](https://github.com/Open-Athena/marin-dna/issues/369)), suggesting more labeled data is the bottleneck. Jacob Silterra introduced BioConfoundBench in <#1356487738840318002>, an eval designed around misleading train/test splits in biological datasets.

## News & Research

- [SonicMoE](https://arxiv.org/pdf/2512.14080) — dlwh extending this fused MoE kernel approach for expert parallelism
- [Test-Time Curricula for Targeted RL (SIFT)](https://arxiv.org/pdf/2510.04786) — shared by Bhavishya for targeted data filtering before GRPO
- [Normalization-free networks paper](https://arxiv.org/abs/2503.10622) — discussed in #random; Kevin Yin confirmed no practical improvements over RMSNorm
- [vLLM Native RL APIs blog post](https://vllm.ai/blog/2026-05-28-native-rl-apis) — romain flagged for MarinSkyRL planning
- [Mistral Nemo tokenizer](https://mistral.ai/news/mistral-nemo/) — willheld noted it as a Llama tokenizer drop-in replacement used by Nemotron & Mistral
- Benjamin Feuer published a [priority evals list](https://github.com/marin-community/marin/issues/7090) for community contributions
