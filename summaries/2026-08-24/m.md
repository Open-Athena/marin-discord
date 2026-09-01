## <#1354881461060243561> — Community & Announcements

The server saw a massive influx of **435+ new members** via <#1375164400239120504>, with waves of joins especially on Aug 29. Percy Liang [announced](https://discord.com/channels/1354881461060243556/1354881461060243561/1541584912082149406) a **Sept 1 community meeting panel/QA on the hero run** at 10am PT, featuring the core contributors. Larry noted they'd also share findings from the first 10 days of the run. dlwh encouraged newcomers to introduce themselves in <#1357057383830126652>, which saw 50 introductions from researchers at FAIR, Together AI, ByteDance, Prime Intellect, Amazon, Microsoft, and several universities.

## <#1516150256499163166> — MarinFold Protein Structure

zwn posted the [weekly update](https://discord.com/channels/1354881461060243556/1516150256499163166/1541530216973738004): **decontaminated eval and training sets** are now in use (per [#225](https://github.com/Open-Athena/MarinFold/issues/225)), with two surviving runs serving as starting points for cooldown training. Tim got the **first end-to-end RL setup working** for MarinFold, fine-tuning a checkpoint to emit multiple contact map candidates with RL and multiple reward functions, though RL-trained models aren't yet beating strong baselines ([#239](https://github.com/Open-Athena/MarinFold/issues/239)). On 3D structures, Helico already extracts essentially all value from top-L binary contacts ([#249](https://github.com/Open-Athena/MarinFold/issues/249)). Al (@alxrms) shared [neural token document experiments](https://discord.com/channels/1354881461060243556/1516150256499163166/1541535852201508934) and offered to revive the full corpus pipeline if anyone plans modeling experiments.

## <#1462895580064911522> — Data Mixing & Reproducibility

dlwh [proposed](https://discord.com/channels/1354881461060243556/1462895580064911522/1542677539799961770) publishing **detailed per-document metadata** for all training data — canonical dataset IDs, shard paths, and document identifiers — so researchers with appropriate access can reconstruct the data from original providers. rav agreed on a phased approach: clean up the pipeline, release reports, then release data/models and blog. willheld landed [PR #8759](https://github.com/marin-community/marin/pull/8759) documenting how to **re-hydrate the 3 sources requiring external execution**, noting that several datasets (e.g., Nemotron) [forbid redistribution](https://discord.com/channels/1354881461060243556/1462895580064911522/1543322065484910652) and the project prefers keeping attribution clear.

## <#1418673157585502370> — DNA Models

Gonzalo Benegas shared **six detailed experiment write-ups** covering the MarinDNA pipeline: [center-seeded projection](https://discord.com/channels/1354881461060243556/1418673157585502370/1542237927302627409) (#473) simplified the whole-genome alignment pipeline with equivalent results; [conservation predictability](https://discord.com/channels/1354881461060243556/1418673157585502370/1542238259227394279) (#478) showed conserved tokens are increasingly well-predicted from 46M to 4B parameters; [likelihood dynamics](https://discord.com/channels/1354881461060243556/1418673157585502370/1542238294337790075) (#489) tracked token-scaling effects; [MNTP adaptation](https://discord.com/channels/1354881461060243556/1418673157585502370/1542238364445573130) (#479) failed to add bidirectionality to an autoregressive checkpoint; and two experiments on [inference context sensitivity](https://discord.com/channels/1354881461060243556/1418673157585502370/1542238458083410053) (#485) and [species-prompt conditioning](https://discord.com/channels/1354881461060243556/1418673157585502370/1542238511262863461) (#486) for VEP.

## <#1365058937589858324> — Code Review & Infrastructure

mcwitt's [PR #8549](https://github.com/marin-community/marin/pull/8549) reworked the **ragged all-to-all EP backend** to achieve comparable or better MFU than pooled-wave at much lower drop rates. A [follow-up PR #8684](https://github.com/marin-community/marin/pull/8684) made it the **default EP backend for the hero run**, also pinning a patched PJRT wheel from a new Marin XLA fork — this was the [most-reacted code PR](https://discord.com/channels/1354881461060243556/1365058937589858324/1542977289451741315) of the week. willheld bumped Cutlass, QuACK, and Flash Attention via [PR #8741](https://github.com/marin-community/marin/pull/8741) to fix **frequent NaNs on H100** from an SM90 bug. He also [upstreamed agent coding guidelines](https://github.com/marin-community/marin/pull/8746) and set up an [H100-friendly hero config replica](https://github.com/marin-community/marin/pull/8673) for non-hardware-sensitive experiments.

## <#1356487738840318002> — Evals

Bilibird submitted an [extended MATH grader PR](https://github.com/marin-community/evalchemy/pull/95) to Evalchemy. Mrinal Kumar [clarified](https://discord.com/channels/1354881461060243556/1356487738840318002/1542237391580827719) that reusable benchmark pieces belong in Evalchemy while Marin handles experiment-level orchestration (budget/checkpoint sweeps, metric aggregation). EvgeniyZh [asked](https://discord.com/channels/1354881461060243556/1356487738840318002/1542846101193883739) about adding more benchmarks and was encouraged to open PRs/issues in either direction.

## <#1356490712199462912> — Scaling Laws

ahmet [asked](https://discord.com/channels/1354881461060243556/1356490712199462912/1543303047579570176) why the MoE series uses HP scaling laws rather than muP. willheld [explained](https://discord.com/channels/1354881461060243556/1356490712199462912/1543325551635464232) that muP is effectively just one named HP scaling heuristic adjusting LR as a function of hidden dim, but it misses token horizon, batch size, and other factors. He recommended the survey at [A Hitchhiker's Guide to Scaling Laws](https://arxiv.org/html/2512.22382v1) and emphasized that all such methods are heuristics best compared by running scaling ladders empirically. Ahmed M Ahmed later asked about whether Delphi scaling ladder forecasts use Paloma validation or test splits.

## <#1540486417078296576> — Hero Run 2026

The hero run is **tracking ahead of scaling law predictions**. Ahmed M Ahmed [raised](https://discord.com/channels/1354881461060243556/1540486417078296576/1541330737117134899) concerns about faithfully showing loss/gradient spikes on W&B. Larry [explained](https://discord.com/channels/1354881461060243556/1540486417078296576/1541472757735366706) that loss spikes show in real time but grad norms are only logged every 10 steps. He also detailed [architectural choices](https://discord.com/channels/1354881461060243556/1540486417078296576/1541482019790266398) made to avoid grad spikes — e.g., keeping embed in AdamH showed spikes at 40% above optimal LR, so they chose features in flat hyper basins.

## <#1380235124011958313> — Long Context

dlwh [revealed](https://discord.com/channels/1354881461060243556/1380235124011958313/1543013645234217091) that a **67B-A2B model is nearing completion** with long context extension out to **262K tokens** (while Larry is on vacation). He noted the lack of good pretraining-stage long-context evals — MRCR requires too much instruction-following for base models. He introduced **"RiffleEval"**, a [partially synthetic task](https://discord.com/channels/1354881461060243556/1380235124011958313/1543017917124313278) that interleaves medium-length docs with a riffle shuffle to test the model's ability to jump between contexts. He expressed moderate confidence in the surgery but less confidence in the data mix.

## <#1374989195109466122> — Reinforcement Learning

Benjamin Feuer [shared results](https://discord.com/channels/1354881461060243556/1374989195109466122/1542681739497832499) from **RL on Snowball models** (the most-reacted message of the week with 8 reactions): Experiment E6 improved **AIME24 from 17.67% to 27%**, **MATH-500 from 64% to 78%**, and **OlympiadBench from 12.67% to 20%**. Both the first cooldown (thinking checkpoint) and the stronger 5.7T agentic SFT model benefited from RL training. This connects to the [Delphi RL scaling laws issue #6279](https://github.com/marin-community/marin/issues/6279).

## <#1385733711013871729> — Inference

romain [announced](https://discord.com/channels/1354881461060243556/1385733711013871729/1543333342529851484) that **vLLM inference support on H100s** for the hero architecture has landed ([vllm#51](https://github.com/marin-community/vllm/pull/51), [marin#8720](https://github.com/marin-community/marin/pull/8720)), tested on the largest ladder checkpoint. He shared a [config gist](https://gist.github.com/yonromai/09faea42c1dbb931ce9d2f2456cd2a16) to get started.

## <#1406020028884717719> — Safety Training

dlwh [noted](https://discord.com/channels/1354881461060243556/1406020028884717719/1542669622048850030) a puzzling finding from Gustavo Sandoval: **Marin 8B becomes more willing to output misinformation during cooldown**, despite that being when high-quality data is introduced. He solicited hypotheses from the community.

## News & Research

- willheld recommended [A Hitchhiker's Guide to Scaling Laws](https://arxiv.org/html/2512.22382v1) as a survey connecting various HP scaling heuristics including muP
- willheld proposed bumping to a newer version of Uncheatable Eval that adds fresh crawl, new programming languages, and BioRxiv
