## <#1354881461060243561> — Hero Run Launch

Percy Liang [canceled the weekly community meeting](https://discord.com/channels/1354881461060243556/1354881461060243561/1539024313041162301) so the team could sprint on launching the next hero run. The **535B-A23B MoE on 18T tokens** was officially announced with a [GitHub issue](https://github.com/marin-community/marin/issues/8435) and [scaling ladder W&B report](https://wandb.ai/marin-community/marin_moe/reports/535B-A23B-18T-Token-Hero-Run-Scaling-Ladder--VmlldzoxNzc2MDM5Ng). dlwh [created a dedicated #hero-run-2026 channel](https://discord.com/channels/1354881461060243556/1354881461060243561/1540486690093670562) after community interest.

## <#1540486417078296576> — Hero Run Details

The run uses **11 racks on CoreWeave** — dlwh noted they'll [share more about the funding publicly soon](https://discord.com/channels/1354881461060243556/1540486417078296576/1540510939831472188). Training is in bf16/fp16, [not fp8 or fp4](https://discord.com/channels/1354881461060243556/1540486417078296576/1541185526269354214) — the team was hesitant to use mxfp8 on the big run without more small-scale validation, and fp4 pretraining is still in research.

## <#1516150256499163166> — MarinFold Protein Structure Prediction

Tim O'Donnell posted a [comprehensive weekly update](https://discord.com/channels/1354881461060243556/1516150256499163166/1538982687421894666). Key highlights:
- **New best model surpasses single-sequence Protenix** (end-of-August goal achieved early) with R-precision 0.6307 / val loss 2.9397 ([#238](https://github.com/Open-Athena/MarinFold/issues/238), [#239](https://github.com/Open-Athena/MarinFold/pull/239)).
- **Eval decontamination**: training set had proteins similar to eval set. A new decontaminated training set (30% sequence identity threshold) is being swept ([#232](https://github.com/Open-Athena/MarinFold/issues/232)). On the stricter "eval2" set, the headline advantage over Protenix shrinks (natural proteins: 0.358 vs 0.326, CI crosses zero).
- **RL on multi-draft models shows early promise** ([#237](https://github.com/Open-Athena/MarinFold/issues/237)), unlike earlier single-draft RL which failed to improve consensus R-precision.
- **Contacts-to-3D fine-tuned model** (helico) matches MSA-based prediction with oracle contacts. Only 0.28 epochs trained so far — room for improvement.
- Tim will be on vacation next week; @zwn will run the meeting.

## <#1365044508546568372> — MoE Scaling & Architecture

Larry reported the **67B-A2B on 10T tokens is now the lowest Paloma macro loss ever** ([link](https://discord.com/channels/1354881461060243556/1365044508546568372/1539041994008039516)), with performance improving after switching to mix2 and longer context. He shared [router initialization details](https://discord.com/channels/1354881461060243556/1365044508546568372/1538795847897063505): init to 0.5/√hidden_dim with QB balancing. catto proposed an initialization trick for perfect first-batch load balancing; Larry was open to testing it in future runs.

## <#1462895580064911522> — Data Mixing

willheld shared the new production mix weights, noting that "Emotions, Relationships, and Wellbeing" was getting [over-upweighted due to MCQ-heavy sentiment data](https://discord.com/channels/1354881461060243556/1462895580064911522/1539141400212537445). The mix [underperformed the old mix in ladder simulation](https://discord.com/channels/1354881461060243556/1462895580064911522/1539387191216709673) — Bayesian search didn't reduce the needed sample size as hoped. He also released a [token provenance explorer](https://storage.googleapis.com/marin-public/held/harrier-provenance-explorer/2026.08.19/index.html?responsive-arrow=20260819) showing flow from 292 sources to 200 domain×quality buckets.

## <#1356487738840318002> — Evals & Agent Leaderboard

ayushsunilmunot opened [issue #8357](https://github.com/marin-community/marin/issues/8357) to evaluate whether models spend the right amount of thinking tokens. cdd [volunteered to contribute](https://discord.com/channels/1354881461060243556/1356487738840318002/1539167728907067483) with adaptive inference-time token budgeting. Mrinal Kumar reported flawed-summ evals progressing at 8–10/day on TACC and submitted PRs to [OpenThoughts-Agent](https://github.com/open-thoughts/OpenThoughts-Agent/pull/85) and the [OT-Agent-Leaderboard](https://github.com/open-thoughts/OT-Agent-Leaderboard/pull/27). Benjamin Feuer enabled agent-reviewed self-merging for those repos.

## <#1374989195109466122> — Reinforcement Learning

Benjamin Feuer published several substantive reports:
- [Harness/context-length/summarization ablation](https://storage.googleapis.com/marin-public/benjaminfeuer/harness-context-length-summ-ablation/2026.08.17/index.html): best harness is model- and dataset-dependent; native tool-calling doesn't outperform terminus-2 style.
- [Cross-cluster HPO](https://storage.googleapis.com/marin-public/benjaminfeuer/tasktrove-hparam-optimization/2026.08.18/index.html) ([#7785](https://github.com/marin-community/marin/issues/7785)): wide tolerance band for RL peak performance; weaker students can match stronger teachers with enough RL.
- [TaskTrove reward deltas](https://storage.googleapis.com/marin-public/benjaminfeuer/tasktrove-reward-deltas/2026.08.20/index.html) ([#8485](https://github.com/marin-community/marin/issues/8485)): ≥24 sources with meaningful, monotonic reward gaps across model tiers.
- Jupiter cluster hangs [diagnosed as likely HPC-X RDMA or NCCL 2.28.9 bug](https://discord.com/channels/1354881461060243556/1374989195109466122/1539379745035391106); reducing `worker_collective_timeout_seconds` to 300 helps.

## <#1357080963472949428> — Scaling Law Q&A

Matheart asked about the loss extrapolation methodology shown in Percy's tweet. Larry [explained it's a simple power law](https://discord.com/channels/1354881461060243556/1357080963472949428/1540601756965281944) fit on 4 ladder data points at the same training percentage, same LR schedule shape, and same tokens-per-parameter ratio. He noted the prior run's extrapolation was accurate to within 1% with only 3 points. On confidence intervals, Larry argued there aren't enough data points for reliable bootstrapping and [the assumptions needed would give false precision](https://discord.com/channels/1354881461060243556/1357080963472949428/1540603912115982336). Matheart asked about applicability to non-compute-optimal runs, mentioning Bayesian extrapolation methods.

## <#1365058937589858324> — Infrastructure & Code Review

romain submitted a [vLLM PR for TPU support](https://github.com/marin-community/vllm/pull/47) and a PR to [index Marin forks in echo](https://github.com/marin-community/marin/pull/8448). Percy Liang [explained the rationale](https://discord.com/channels/1354881461060243556/1357080963472949428/1540014455612641290) for maintaining a Marin vLLM fork: freedom to experiment with architecture while supporting diverse hardware (TPUs, H100s, B200s). In <#1366632114316906506>, rohithck filed [#8594](https://github.com/marin-community/marin/issues/8594) about a regression in Zephyr pipeline cancellation from other threads.

## Community & News

15 new members joined the server this week, including researchers from TU Munich, USC, CENIA Chile, Sandia National Labs, and Living Models (foundation models for plant biology). In <#1356487690559684638>, jku100 shared [Hyperparameter transfer to 10T tokens for 155BA17B MoE](https://arxiv.org/abs/2608.20061). In <#1462884917292699669>, mansimov discussed automated research agents, noting current systems are essentially doing hyperparameter search rather than generating novel ideas.
