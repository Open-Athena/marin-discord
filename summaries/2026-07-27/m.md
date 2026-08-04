## <#1516150256499163166> — MarinFold Progress

Tim O'Donnell posted the comprehensive [weekly update](https://discord.com/channels/1354881461060243556/1516150256499163166/1531377426708561960): Eric Czech's best 1.5B model ([#117](https://github.com/Open-Athena/MarinFold/issues/117)) achieves **R-precision 0.53** on the 554-protein contact benchmark, up from 0.42, closing the gap to Protenix v2 SS. The ESMFold2-Atlas contacts-v1 corpus landed with **66.8M documents / 71.4B tokens** ([#139](https://github.com/Open-Athena/MarinFold/issues/139), [#141](https://github.com/Open-Athena/MarinFold/pull/141)), a 16× expansion over the AFDB set.

Multiple new experimental directions are active: zwn started a [greedy latent contact-set loss](https://discord.com/channels/1354881461060243556/1516150256499163166/1531345956321230975) ([#156](https://github.com/Open-Athena/MarinFold/issues/156), [#167](https://github.com/Open-Athena/MarinFold/pull/167)) that trains on unordered contact sets instead of penalizing arbitrary serialization order. Tim is running two post-training experiments: **backtracking** via `<retract>` tokens ([#158](https://github.com/Open-Athena/MarinFold/issues/158)–[#161](https://github.com/Open-Athena/MarinFold/pull/161)) and **rollout refinement** ([#163](https://github.com/Open-Athena/MarinFold/issues/163)). Eric Czech is [scaling to 3B and 6B](https://discord.com/channels/1354881461060243556/1516150256499163166/1531377505729249610) ([#154](https://github.com/Open-Athena/MarinFold/issues/154)). An inference fix removed `top_k=50` sampling bias that was shortening rollouts ([#142](https://github.com/Open-Athena/MarinFold/issues/142)). Al (@alxrms) is postponing neural tokenizer sweeps due to oceans project deadlines.

## <#1406020028884717719> — Safety & Red-Teaming

G Sandoval did an [initial red-teaming MVP](https://discord.com/channels/1354881461060243556/1406020028884717719/1532208876919718039) comparing **Marin-8B** against Olmo-3-7B-Instruct. Key finding: neither model is tamper-resistant — a fine-tuning attack with ~100 public examples drives attack-success from ~6–16% to **~99% within 10 steps**. Default safety scores are roughly comparable, with Marin stronger on DoAnythingNow (+18pp) but weaker on HarmBench (−6.6pp).

Huu Nguyen [shared findings](https://discord.com/channels/1354881461060243556/1406020028884717719/1531681356675809281) that synthetic data with reasoning traces can instill alignment properties during pretraining, and linked [Synthetic Persona Pretraining](https://www.lesswrong.com/posts/3xQQK9i8mhJDE2uMg/synthetic-persona-pretraining-alignment-from-token-zero) from Bob West's team. He proposed creating distinct robot-persona tokens (seeded from "I"/"me" embeddings) to prevent persona pollution. G Sandoval also pointed to [Gradient Routing](https://arxiv.org/pdf/2410.04332) from MATS as a more robust approach. Benjamin Feuer [asked](https://discord.com/channels/1354881461060243556/1406020028884717719/1532391205848088676) for public GitHub issues to surface these findings.

## <#1364827114670657616> — Infrastructure

Russell Power [documented agentic evals](https://discord.com/channels/1354881461060243556/1364827114670657616/1531356106830381146) in [PR #7674](https://github.com/marin-community/marin/pull/7674) in response to Benjamin Feuer's question about the canonical approach. Larry [reported](https://discord.com/channels/1354881461060243556/1364827114670657616/1531348979185356882) wandb logging stopped on the 67B run despite the Iris job continuing. Neha Hulkund asked about us-east availability; willheld [clarified](https://discord.com/channels/1354881461060243556/1364827114670657616/1532174805317718237) it's TPU Research Cloud capacity cycling, not a region outage. Russell Power recommended structuring jobs for any-region scheduling, pointing to Eric Czech's `batch_calibration.py` approach. rav deployed a restart of all Iris controllers with recent main.

## <#1374989195109466122> — Reinforcement Learning

marianna13 [reported](https://discord.com/channels/1354881461060243556/1374989195109466122/1531644649230438591) that filtering R2E-gym to a "learnable band" (tasks with headroom for RL) converges faster to ~45 p@1 on SWE-bench but doesn't push beyond that ceiling. Benjamin Feuer posted the [TaskTrove RL campaign wrap-up](https://github.com/marin-community/marin/issues/7784). Neha Hulkund is finishing Delphi MoE midtraining scaling replication and plans to pass best mid-trained models for post-training experiments. Mrinal Kumar will create a recurring eval meeting starting next week.

## <#1368297424086499359> — Data Curation & <#1462895580064911522> — Data Mixing

Franziska Weindel [announced](https://discord.com/channels/1354881461060243556/1368297424086499359/1531969250607104200) a weekly data breakout room starting Aug 6, Thursdays 9–10am PT. Multiple contributors signed up. Common Crawl's wumpus shared a [blog post on crawl coverage measurement](https://commoncrawl.org/blog/measuring-crawled-coverage-of-a-website-in-common-crawl).

willheld [announced](https://discord.com/channels/1354881461060243556/1462895580064911522/1532156537794068541) the raw data pool has reached **25T tokens** (pre-dedupe), with Stack v3 replacing Dolma 3.5 and CommonPile stack-V2 for better public accessibility, plus CommonCrawl DocX extraction. With an EoY budget of ~20T tokens, there's room for quality filtering rather than just reweighting. Percy Liang and rav [discussed](https://discord.com/channels/1354881461060243556/1462895580064911522/1531462806308913194) how KRR and DSP extrapolate to new distributions and reusing old swarm data across bucket changes.

## <#1365044508546568372> — 67B MoE Training

Larry [reported](https://discord.com/channels/1354881461060243556/1365044508546568372/1533528895574507623) the second cooldown should complete at 6T tokens, with the main 10T run [tracking the stage 1 forecast](https://discord.com/channels/1354881461060243556/1365044508546568372/1533604106256515113). He also proposed token-level analysis of train loss vs epoching, noting some data in the current mix epochs up to 7 times.

## <#1483266366772351067> — Midtraining

Neha Hulkund [skipped the breakout meeting](https://discord.com/channels/1354881461060243556/1483266366772351067/1532815483059966253) this week — she's SFT'ing different models across the scaling ladder with different mixes and will drop a GitHub issue with results when ready.

## <#1385733711013871729> — Inference & <#1527756652890161292> — Architecture

romain shared [serving topology analysis](https://github.com/marin-community/marin/issues/7706) for the potential 360B-A22B model. Larry [noted](https://discord.com/channels/1354881461060243556/1356487690559684638/1531327465799024882) that Kimi's K3 tech report drops RoPE on MLA, recovering local position awareness through KDA layers, and connected it to the Longcat approach in <#1527756652890161292>.

## News & Research

- [Kimi K3 Tech Report](https://github.com/MoonshotAI/Kimi-K3/blob/main/k3_tech_report.pdf) — drops RoPE on MLA, uses KDA layers for local position awareness (shared by Larry)
- [Online KL Shampoo](https://blog.tilderesearch.com/blog/online-kl-shampoo) — new optimizer from Tilde Research; Larry noted the 98% throughput claim is contextual (2× slower optimizer step but amortized at high batch/low param)
- [Synthetic Persona Pretraining](https://www.lesswrong.com/posts/3xQQK9i8mhJDE2uMg/synthetic-persona-pretraining-alignment-from-token-zero) — alignment from token zero via thinking traces (shared by Huu Nguyen)
- [Gradient Routing](https://arxiv.org/pdf/2410.04332) — data-dependent gradient masks for tamper-resistant safety (shared by G Sandoval)
- Liquid AI's [LFM-25 Encoder 230M](https://docs.liquid.ai/lfm/models/lfm25-encoder-230m) — shared by willheld for quality tagging
- Percy Liang shared the [weekly priorities update](https://github.com/marin-community/marin/issues/7669), pushing to finalize architecture ([#7201](https://github.com/marin-community/marin/issues/7201)) and model sizing/timeline ([#7673](https://github.com/marin-community/marin/issues/7673))
