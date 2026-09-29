## <#1374989195109466122> — Reinforcement Learning

marianna13 kicked off a [TaskTrove sweep](https://discord.com/channels/1354881461060243556/1374989195109466122/1551549101777223680) to identify learnable task subsets for the Snowball base model, planning to try Mix RL/domain expert RL once good subsets are found. Harshit Varma shared [detailed RL findings](https://discord.com/channels/1354881461060243556/1374989195109466122/1551721992040882276) on RTS, Endless Terminals, and Instruction Following.

lukedhlee posted a key result: [SFT→RL adds 8+ points over SFT or RL alone on SWE-Bench](https://discord.com/channels/1354881461060243556/1374989195109466122/1552048522403250178) ([issue #9225](https://github.com/marin-community/marin/issues/9225)), and plans to move to the new 10T checkpoint with Terminus 2. Harshit Varma followed up with [harness comparison results](https://discord.com/channels/1354881461060243556/1374989195109466122/1553135276946231297) showing mini-swe-agent (MSA) outperforms Terminus-2 for the 0921 SFT checkpoint with ~94% valid tool calls vs ~25-45% under Terminus-2. willheld [confirmed MSA is what Artificial Analysis uses](https://discord.com/channels/1354881461060243556/1374989195109466122/1553135557381455923) and also fixed the [grug reasoning parser](https://github.com/marin-community/vllm/pull/79).

MiMo open-sourced their [RL environments](https://huggingface.co/datasets/XiaomiMiMo/MiMo-V2.6-RL-oss) (~7K envs), though dlwh [noted](https://discord.com/channels/1354881461060243556/1356487690559684638/1553240652505022475) many are missing useful grader information. cole shared the [DeepSeek Elastic Compute sandbox paper](https://arxiv.org/abs/2609.22978) as potentially relevant infrastructure.

## <#1516150256499163166> — MarinFold

Tim O'Donnell posted the [weekly MarinFold update](https://discord.com/channels/1354881461060243556/1516150256499163166/1551670589037481999). Key findings: a second training epoch on native + ProteinMPNN corpus [did not meaningfully improve contact accuracy](https://discord.com/channels/1354881461060243556/1516150256499163166/1551670627709100293) (R-precision 0.5551→0.5575, [#277](https://github.com/Open-Athena/MarinFold/issues/277)). Zack's "delta stream" document format [looks promising](https://discord.com/channels/1354881461060243556/1516150256499163166/1551670646415564920) at 0.5464 R-precision but still below the default 0.621 ([#299](https://github.com/Open-Athena/MarinFold/issues/299)). Exact soft contact targets [retain a small val-loss lead](https://discord.com/channels/1354881461060243556/1516150256499163166/1551670667974549504) ([#279](https://github.com/Open-Athena/MarinFold/issues/279)).

On data: ~2.95M of 4.82M Proteina candidates passed initial filters but need decontamination ([#278](https://github.com/Open-Athena/MarinFold/issues/278)), and the AFDB/ESM supplement yielded 92,511 structurally novel pairs out of 13.73M ([#292](https://github.com/Open-Athena/MarinFold/issues/292)). The 0.7B/1.5B/3B model size sweep is underway ([#288](https://github.com/Open-Athena/MarinFold/issues/288)).

## <#1354881461060243561> — General & Community

dlwh highlighted willheld's [in-depth blog post on the DataKit pipeline](https://openathena.ai/blog/marin-data-pipeline-overview/) that powers both pretraining and SFT mixes. Larry announced a [new automated experiment loop](https://discord.com/channels/1354881461060243556/1354881461060243561/1553166831550857296) running 8-minute pretraining experiments on H100s — anyone can drop architecture/kernel change ideas as comments in [issue #9451](https://github.com/marin-community/marin/issues/9451) and the agent will pick them up.

The Alt Man asked about data accessibility, noting the hero data mix uses private S3 paths. willheld [pointed to the reproducibility docs](https://github.com/marin-community/marin/blob/9afc69a80d2dcf89ac4dfda534ac888e9d7cd9a6/docs/reproducibility/pretraining-source-pool.md) and explained why re-hosting other people's datasets isn't feasible. dlwh [offered to create a metadata-only version](https://discord.com/channels/1354881461060243556/1354881461060243561/1553196891389296681) of the hero data mix to skip the annoying steps. Larry noted @rav is [connecting the data pipeline to the experiment loop](https://discord.com/channels/1354881461060243556/1354881461060243561/1553196549771632782) so baselines can be rerun on FineWeb as a common reference.

## <#1368297424086499359> — Data Curation

Mark shared work on [using GLM5.3 to generate synthetic RL tasks/envs](https://discord.com/channels/1354881461060243556/1368297424086499359/1551990749044670508) and asked for feedback before scaling up. lukedhlee asked about a [centralized catalog for SFT data and RL envs](https://discord.com/channels/1354881461060243556/1368297424086499359/1552807278585978921); willheld pointed to existing code-indexed sources. marianna13 [updated her dataset catalog](https://gist.github.com/marianna13/b088dd4b39564bde1e4b21aeadb09171) and suggested starting with ~1K representative tasks validated by Prime Intellect. HessianFree asked about [why certain teacher subsets were dropped](https://discord.com/channels/1354881461060243556/1368297424086499359/1553552860464291841) from the latest SFT mix.

## <#1462895580064911522> — Data Mixing

Ahmed M Ahmed praised the DataKit blog post and shared an amusing anecdote about [accidentally leaking GSM8K into a training set](https://discord.com/channels/1354881461060243556/1462895580064911522/1553179403243225169) (~1 year ago), with dlwh noting this happened to AI2 as well. Ahmed then posted [detailed technical questions](https://discord.com/channels/1354881461060243556/1462895580064911522/1553183226497859635) about the data mix methodology — including reconciling the 872 vs >1,000 proxy run counts, which surrogate produced the launch weights, and how domain-weight sensitivity was assessed.

## <#1527756652890161292> — Architecture

Larry shared a [paper showing QK-norm is compatible with MLA](https://arxiv.org/abs/2606.16310), but Kaiyue-Wen [explained](https://discord.com/channels/1354881461060243556/1527756652890161292/1551997294805520455) that Kimi/Jianlin Su found this adds one scalar per head to KV cache — a 33% increase for DeepSeek V3's 128-head architecture. Larry noted the hero run's KV compression setup and observed that K3 kept 64 shared head dims despite dropping RoPE, possibly for kernel compatibility. Separately, dlwh confirmed Snowball is [~83x overtrained](https://discord.com/channels/1354881461060243556/1527756652890161292/1552165812905844758) beyond compute optimal at ~60 tokens per active parameter.

## <#1365058937589858324> — Code Review

mcwitt landed PRs for [~27% MFU with an additional 3% training time reduction](https://discord.com/channels/1354881461060243556/1365058937589858324/1552364645551972393) from GC coordination changes ([#9333](https://github.com/marin-community/marin/pull/9333), [#9378](https://github.com/marin-community/marin/pull/9378)), plus a [hotfix for hero-shape breakage](https://github.com/marin-community/marin/pull/9346) from #9117. rav continued the "iris federation campaign" with multiple PRs ([#8327](https://github.com/marin-community/marin/pull/8327), [#9356](https://github.com/marin-community/marin/pull/9356), [#9399](https://github.com/marin-community/marin/pull/9399)). Ayush Nangia submitted fixes for [no-op resume checkpoints](https://github.com/marin-community/marin/pull/9416), [scratch attempts affecting eval scores](https://github.com/marin-community/marin/pull/9419), and [raw reward by domain in Gym RL](https://github.com/marin-community/MarinSkyRL/pull/764).

## <#1364827114670657616> — Infrastructure

rohithck flagged a [disk fill issue](https://github.com/marin-community/marin/issues/9487) on TPU clusters from hardlink mode and suggested [reverting to symlinks](https://discord.com/channels/1354881461060243556/1364827114670657616/1553813432615182486). Russell Power agreed but noted workers should be cleaning up runtime directories. yurusankyo reported being unable to get a v6e-64 slice for 55+ hours; Furkan and dlwh [explained](https://discord.com/channels/1354881461060243556/1364827114670657616/1553874676256743445) that larger slices are harder to place and v6e-{1,2,4,8} come from a different pool.

## <#1355318637854199848> — SFT

willheld released the [Grug-67B SFT checkpoint (09.21)](https://huggingface.co/open-athena/Grug-67B-A2B-Datakit-SFT-262K-2026.09.21) with explicit Terminus training and `/think`/`/nothink` mode support, [recommending `/nothink` for Terminus](https://discord.com/channels/1354881461060243556/1355318637854199848/1552024155959066787) since it embeds reasoning in JSON fields. Michael Siu shared [promising results using Rank-Surprisal Ratio (RSR)](https://discord.com/channels/1354881461060243556/1355318637854199848/1552085529741238394) as a proxy for teacher data selection — RSR matched published teacher rankings on OpenThoughts-Agent and Terminal-Lego, and low-RSR trajectory selection showed improvements.

## <#1540486417078296576> — Hero Run 2026

mcwitt [relaunched the hero run](https://discord.com/channels/1354881461060243556/1540486417078296576/1552442767672869005) with performance improvements netting ~10% throughput (details in [#9378](https://github.com/marin-community/marin/pull/9378)). Larry [noted](https://discord.com/channels/1354881461060243556/1540486417078296576/1552517898990260305) the MFU boosts give more confidence to try crazier architecture changes in future runs. dlwh's "[sooner and sooner](https://discord.com/channels/1354881461060243556/1540486417078296576/1552817035409358908)" was one of the most-reacted messages of the week.

## <#1435048655894872248> — Multimodality

TheWizard joined and expressed interest in multimodal work. willheld [noted](https://discord.com/channels/1354881461060243556/1435048655894872248/1552705312753189044) there's nothing on the current roadmap for multimodality — prior audio work ([SODA](https://soda-audio.github.io/index.html)) was led by Punpun during his Stanford visit. TheWizard is [drafting a plan for omni-multimodal support](https://discord.com/channels/1354881461060243556/1435048655894872248/1553477598875619482) starting with audio and images, to be proposed as a GitHub issue.

## <#1366632114316906506> — Code Talk

dlwh raised the question of [merging diverging math graders](https://discord.com/channels/1354881461060243556/1366632114316906506/1553175105004371970) between evalchemy ([PR #178](https://github.com/marin-community/evalchemy/pull/178)) and task_trove. Russell Power agreed they need to stay in sync and noted his change was specifically to avoid LLM-as-judge in his "Recursive Self SFT" loop.

## News & Research

- Kaiyue-Wen shared the [OpenRSI Foundation index](https://index.openrsi.foundation/index.html), which uses the Marin pretraining ladder for RSI — Wenhao Chai [expressed excitement](https://discord.com/channels/1354881461060243556/1356487690559684638/1552859353542041631) about contributing back
- Kaiyue-Wen shared a post on [TPU megakernels](https://inferact.ai/blog/tpu-megakernels) calling it "pretty shocking"
- willheld highlighted a [Tencent RL hyperparameter optimization paper](https://arxiv.org/pdf/2608.29296)
- Pinak shared [SmolDataEnvs](https://huggingface.co/datasets/FineEnvs/SmolDataEnvs) dataset
- willheld shared [a mechinterp paper](https://arxiv.org/abs/2609.25518) isolating refusal behavior to 1-2% of model params
- TheWizard recommended Yi Ma's [deep representation learning book](https://ma-lab-berkeley.github.io/deep-representation-learning-book/)
- Mayank shared the [Rigel blog post](https://open-lm-engine.github.io/blog/rigel/) on multi-architecture pretraining across different clusters
- marianna13 shared a [paper on curriculum RL](https://arxiv.org/pdf/2602.02710)
- 44 new members joined via <#1375164400239120504>, and notable introductions included a PyTorch team member (jisaacsonmeta), a senior research scientist from ifm.ai (AldoPareja), and a vllm-metal contributor (wildgdl)
