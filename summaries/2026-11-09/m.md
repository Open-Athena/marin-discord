## <#1375164400239120504> — Community Growth

A massive wave of 75+ new members joined the server this week, with large batches arriving on Nov 9 and Nov 11 — likely driven by the community meeting and increased visibility. Percy Liang also [announced](https://discord.com/channels/1354881461060243556/1354881461060243561/1569777406632403116) the first in-person Marin meeting co-hosted with Laude on Nov 17 (6–8pm) in SF.

## <#1555304855822794882> — Marin for Science

Tim O'Donnell led the [first Marin for Science community meeting](https://discord.com/channels/1354881461060243556/1555304855822794882/1569726714882429083), covering contribution guidelines, eval policy, evals/RL data in the Marin repo, and DNA sequence reasoning benchmarks. A key debate emerged around whether TB-Science should be treated as in-distribution or out-of-distribution — Steven Dillmann and Benjamin Feuer [agreed](https://discord.com/channels/1354881461060243556/1555304855822794882/1569842188219715625) that TB-Science main should stay OOD while TB-Science-lite could be ID. Allen committed to [building RL tasks from public courses/textbooks](https://discord.com/channels/1354881461060243556/1555304855822794882/1569837585138974824) without looking at TB-Science. musa shared early work on [SMILES-based chemistry tasks](https://discord.com/channels/1354881461060243556/1555304855822794882/1570275797346820110) (atom counting, molecule equivalence), with Qwen3.8-27B performing surprisingly well. Tim pointed to a related paper: [ChemBench](https://arxiv.org/abs/2505.21318).

## <#1355318637854199848> — SFT Quality & Efficiency

Larry used Claude to [run a detailed audit](https://discord.com/channels/1354881461060243556/1355318637854199848/1569187938154057781) of the Grug-67B SFT mix, surfacing quirky data quality issues and questioning whether SFT's role is primarily about special token awareness vs. behavior shaping. He proposed a [snowball SFT hill-climbing game](https://discord.com/channels/1354881461060243556/1355318637854199848/1569587004960804865) — fixed recipe, variable 5% data subsets, with agent-driven data classification. rav suggested automating the eval→gap→data generation feedback loop. marianna13 reported that [GLM5.3-flash remains a worse teacher than Qwen3.6-35b](https://discord.com/channels/1354881461060243556/1355318637854199848/1569357141855314110) even when controlling for output length, suggesting the gap is about trace compatibility rather than verbosity. karansag wrapped up the [identity SFT report](https://discord.com/channels/1354881461060243556/1355318637854199848/1569389290729902221) — Snowball v0.1 still calls itself ChatGPT/Nemotron without a system prompt. Benjamin Feuer showed that [lookahead packing + 256 segment cap](https://discord.com/channels/1354881461060243556/1355318637854199848/1570852285188407419) reduces Levanter SFT padding from 13.6% to 1.33% ([#11380](https://github.com/marin-community/marin/issues/11380)).

## <#1484315476325826660> — OpenThoughts-Next

Ani shared [judge quality experiments](https://discord.com/channels/1354881461060243556/1484315476325826660/1570110001450713219) on 39 labeled SWE-bench tasks: reviewing only strong model tries achieved 87% accuracy at $0.85/task vs 90% at $1.60/task for all tries. JeniaJitsev and Sankalp Jajee discussed setting up an experiment tracking database. Bilibird asked marianna13 for stored benchmark traces across models.

## <#1388756253538254898> — Getting Started

Several newcomers (znr, siddgood, Efficient_Pi, Cobra) expressed interest in contributing but found it [hard to know where to start](https://discord.com/channels/1354881461060243556/1388756253538254898/1569823982616838206). siddgood [proposed forming a group](https://discord.com/channels/1354881461060243556/1388756253538254898/1570346286266192006) to collaborate on post-training tasks together.

## <#1527756652890161292> — Architecture

amy sartran confirmed that AMD pretraining is [actively in progress](https://discord.com/channels/1354881461060243556/1527756652890161292/1570098039216013534), targeting snowball-scale first ([#9812](https://github.com/marin-community/marin/issues/9812)). Atula Tejaswi [asked about the intuition](https://discord.com/channels/1354881461060243556/1527756652890161292/1569476091477758083) behind the sigmoid gate before vocabulary projection.

## <#1354881461060243561> — Community Meetings & Announcements

Percy Liang hosted the [weekly community meeting](https://discord.com/channels/1354881461060243556/1354881461060243561/1569771716496986172) featuring Benjamin Feuer on post-training (12 reactions — most reacted message of the week). Recording was posted to the usual doc. The [first in-person Marin meetup](https://discord.com/channels/1354881461060243556/1354881461060243561/1569777406632403116) with Laude was announced for Nov 17 in SF.

## <#1516150256499163166> — MarinFold

Tim O'Donnell posted [MarinFold weekly updates](https://discord.com/channels/1354881461060243556/1516150256499163166/1569386717490843950): two epochs of ProteinMPNN-only training (no natural sequences) achieves 0.525 eval-val / 0.674 eval-denovo, closing much of the gap with the full-data default (0.555 / 0.696). The team is [shifting energy toward marin-for-science](https://discord.com/channels/1354881461060243556/1516150256499163166/1569390636006645911), with MarinFold meetings becoming ad hoc.

## <#1374989195109466122> — Reinforcement Learning

Benjamin Feuer shared an [OPD vs SFT ablation](https://discord.com/channels/1354881461060243556/1374989195109466122/1570092201520668733) testing whether on-policy distillation causes less drift and interference than SFT on Snowball — motivated by reducing catastrophic forgetting when adding new skills.

## <#1368297424086499359> & <#1365058937589858324> — Code & Data Fixes

Min Li opened [#11193](https://github.com/marin-community/marin/pull/11193) fixing OpenCode literal quote artifacts and empty system messages in several SFT data subsets. Xiaoyuan Wang submitted PRs ([#11058](https://github.com/marin-community/marin/pull/11058), [#11062](https://github.com/marin-community/marin/pull/11062)) fixing Snowball closure row grading — a stop token was keeping code fences open and causing correct replies to score 0. rohithck flagged a [concerning issue](https://discord.com/channels/1354881461060243556/1366632114316906506/1570150534969827438) where HumanEval accuracy differed by a few percent between v6e-4 and v5p-8 TPU allocations ([#11216](https://github.com/marin-community/marin/issues/11216)).

## <#1550024637927268392> — Mech Interp

likelytobelaura shared a [fun video](https://discord.com/channels/1354881461060243556/1550024637927268392/1570644106735124510) from a SAAR mech interp collaboration where they found and steered a "conspiracy theory neuron" in the Marin 32B model.

## News & Research

- Kaiyue-Wen shared [End-to-End 4-Bit Training](https://thinkingmachines.ai/blog/end-to-end-4-bit-training/) (4 reactions)
- yurusankyo shared [Shizuku](https://shizuku.ai/en/blog/1/), a full-duplex Japanese conversation model trained from scratch
- boba shop cashier shared [gigatoken](https://github.com/marcelroed/gigatoken) tokenization tool
