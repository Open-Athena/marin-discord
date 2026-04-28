## <#1364827114670657616> — Infra & Iris Scheduler

The Iris scheduler crashed mid-week due to a reservation hold job preemption bug — Michael Ryan [flagged it](https://discord.com/channels/1354881461060243556/1364827114670657616/1496318528746426568) and Russell Power diagnosed and fixed it within an hour ([PR #5032](https://github.com/marin-community/marin/pull/5032)). Russell noted that ~50% of scheduler complexity comes from reservation hacks he plans to [remove by next week](https://discord.com/channels/1354881461060243556/1364827114670657616/1496326302502748180).

A **BOS tokenization regression** was discovered by Ahmed M Ahmed — new tokenization caches were silently dropping BOS tokens ([issue #5034](https://github.com/marin-community/marin/issues/5034)). Ahmed [triaged affected directories](https://discord.com/channels/1354881461060243556/1364827114670657616/1497036970851963113) and Russell confirmed via tensorstore scan that [training datasets were safe](https://github.com/marin-community/marin/issues/5149#issuecomment-4314836254) but validation sets were affected. A `Versioned("tokenizer=20260423")` approach was proposed to avoid rerunning large datasets.

Ahmed celebrated [4888 v5p TPUs online](https://discord.com/channels/1354881461060243556/1364827114670657616/1497655867666075738), though willheld noted Claude's estimates on what could be trained were "optimistic." Eric Czech raised the need for [resumable cross-region training](https://discord.com/channels/1354881461060243556/1364827114670657616/1495783846690427015) — currently iris can't follow TPU availability across regions after preemption. Multiple team members reported [GCP reauth every 24-36 hours](https://discord.com/channels/1354881461060243556/1364827114670657616/1497268566091890828), traced to OpenAthena org policy settings (Stanford-authed users like Russell and willheld don't experience it). A scheduler changelog was [posted with 5+ fixes](https://discord.com/channels/1354881461060243556/1364827114670657616/1497277344577224856) including race condition protections and stale client rejection.

## <#1365044508546568372> — MoE Training

Larry reported a **52% speedup on the MoE recipe at 3e19 scale**, with a big contribution from partial key offset (from nanogpt) — [details on GitHub](https://github.com/marin-community/marin/issues/4999#issuecomment-4308631846). The recipe change from MHA to 4:1 GQA caused a 20% compute regression, but LR updates more than compensated.

Larry also identified that [eval scores were inaccurate](https://discord.com/channels/1354881461060243556/1365044508546568372/1495583676283486269) at capacity factor=1 due to OOD eval data flooding single experts — setting capfactor=4 improved github_cpp/bpb from 0.4882 to 0.4259. Kaiyue-Wen [suggested](https://discord.com/channels/1354881461060243556/1365044508546568372/1495613964518817833) adding a sequence-level auxiliary loss like DeepSeek V3.

Pranshu Chaturvedi ran MuonH vs AdamH comparisons and found [no clear difference](https://discord.com/channels/1354881461060243556/1365044508546568372/1497412143144894584) between AdamH baseline, Muon AOL, MuonH base batch, and MuonH 2x batch — though Kaiyue-Wen noted the [y-axis range was too large](https://discord.com/channels/1354881461060243556/1365044508546568372/1497432015375695977) for meaningful comparison. On grad clipping, Larry observed most gradient comes from output_proj (AdamH, constant step size), so [clipping mainly affects non-AdamH params](https://discord.com/channels/1354881461060243556/1365044508546568372/1497388195011363006). Kaiyue-Wen suggested exploring module-wise gradient normalization.

## <#1365058937589858324> — Code Review & Tooling

dlwh added **backward activation logging** with a DAG visualization ([PR #5036](https://github.com/marin-community/marin/pull/5036)) that fits into grug with minimal overhead, logging every 50 steps. He also explored [MCP integration for Codex](https://github.com/marin-community/marin/pull/5042) to give automations network access for babysitting jobs. tdv submitted PRs for [FineProofs-SFT](https://github.com/marin-community/marin/pull/4996) and [NuminaMath](https://github.com/marin-community/marin/pull/4997) math datasets. Russell added [golden tests for Iris DB equivalence](https://github.com/marin-community/marin/pull/5165). Davidrhid submitted their [first PR](https://github.com/marin-community/marin/pull/5150). rav submitted PRs for [datakit source consistency](https://github.com/marin-community/marin/pull/5106) and additional reviews.

## <#1356487690559684638> — News & Papers

The **DeepSeek V4 paper** was the week's top story with [5 reactions](https://discord.com/channels/1354881461060243556/1356487690559684638/1497084545608974406) — Larry [noted interest](https://discord.com/channels/1354881461060243556/1356487690559684638/1497633210472071239) in their sigmoid gating exploration, finding it "a little odd" but planning to test in Marin. willheld shared the [AI2 BAR blog post](https://allenai.org/blog/bar) on batch-size scaling, recommending it alongside FlexOlmo for Larry. cs2716 flagged a [30k multilingual math dataset (MathNet)](https://mathnet.csail.mit.edu/). willheld shared a [PPL gap sets paper](https://arxiv.org/abs/2604.14084) cc'ing dlwh.

## <#1493722964644990996> — Downstream Scaling

rohithck outlined plans to [run models across a scaling ladder](https://discord.com/channels/1354881461060243556/1493722964644990996/1495899857578103014) through the same mid/post-training mixes to predict how the largest model responds to interventions based on smaller models ([issue #4547](https://github.com/marin-community/marin/issues/4547)). willheld referenced [Scaling Data-Constrained Language Models](https://arxiv.org/pdf/2405.10938) as related work; rohithck noted the existing results are [noisier than desired](https://discord.com/channels/1354881461060243556/1493722964644990996/1495920933116968970) but plans to stress test once ladders are available.

## <#1366985639743979541> — Levanter & LoRA

Ahmed M Ahmed [fixed a LoRA bug](https://discord.com/channels/1354881461060243556/1366985639743979541/1495643793142190220) where permuting device order changed XLA's reduction optimization, surfacing issues in modules sharded on `embed_dim` as the output dim. The fix swaps the A/B matrix multiplication order (B @ A instead of A @ B) — same representation power, robust to the edge case.

## <#1483266366772351067> — Midtraining

Ahmed M Ahmed [ran on a v5p-512 pod](https://discord.com/channels/1354881461060243556/1483266366772351067/1497654498150060082) for the first time, kicking off LR tuning runs on the 1e22 nemotron delphi model with 10B tokens of nemotron math — each run takes only 3.5 hours on the large pod.

## <#1462895580064911522> — Data Mixing

willheld shared a [branch with eval patches](https://discord.com/channels/1354881461060243556/1462895580064911522/1497392486677614734) and a [clean PR #5168](https://github.com/marin-community/marin/pull/5168) for data-mixing reference model evaluation, noting some temporary monkey patches may be needed for specific reference models.

## <#1374989195109466122> — RL & Weight Transfer

romain asked about the Ray-dependent weight transfer code; Russell confirmed it's [not in use](https://discord.com/channels/1354881461060243556/1374989195109466122/1495924263021056131) — the team currently uses Arrow Flight for weight transfer.

## Community & Introductions

31 new members joined the welcome room. Notable introductions include Iheb (senior AI engineer at TII, main contributor to [Falcon LLM series](https://discord.com/channels/1354881461060243556/1357057383830126652/1496011903124897895)), zhipeng from LFAI&Data Foundation running a [multimodal speedrun effort](https://discord.com/channels/1354881461060243556/1357057383830126652/1496811914490019840) inspired by Marin, and several PhD researchers in optimization, mech interp, and robotics. Nick asked about [PyTorch Lightning equivalents for JAX](https://discord.com/channels/1354881461060243556/1357080963472949428/1497678058499473540); dlwh responded that increasingly "you don't need frameworks beyond Jax."

## News & Research

- [DeepSeek V4 paper](https://huggingface.co/deepseek-ai/DeepSeek-V4-Pro/blob/main/DeepSeek_V4.pdf) — sigmoid gating, new MoE design choices
- [AI2 BAR blog](https://allenai.org/blog/bar) — batch-size adaptive routing
- [MathNet](https://mathnet.csail.mit.edu/) — 30k math problems in 17 languages
- [PPL gap sets paper](https://arxiv.org/abs/2604.14084) — relevant to evaluation methodology
- [CORE dataset](https://core.ac.uk/) — 2.7TB open-access research papers (shared in data-curation)
- <https://arxiv.org/pdf/2604.21691> — shared by Benjamin Feuer
