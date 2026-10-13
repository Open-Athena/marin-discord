## <#1540486417078296576> — Hero Run Optimizations

dlwh [highlighted](https://discord.com/channels/1354881461060243556/1354881461060243561/1558191050529710100) that mcwitt's latest MoE optimization stack ([#9829–#9834](https://github.com/marin-community/marin/pull/9960)) brought an additional +9% throughput, pushing the hero run to nearly **40% faster** than where it started. The deploy went out Oct 9 around 9:55 AM PT. mcwitt shared the [handoff PR #9960](https://github.com/marin-community/marin/pull/9960) and Furkan asked for links to the full optimization chain, which mcwitt pointed to via [#9378](https://github.com/marin-community/marin/pull/9378). Larry also [investigated](https://github.com/marin-community/marin/issues/9874) off-trend Penn Treebank eval behavior across recent checkpoints.

## <#1366632114316906506> — Verifyit Grader Policy & RL Environment Design

dlwh raised a [tolerance bug in jee_bench](https://discord.com/channels/1354881461060243556/1366632114316906506/1556883388252684359) and asked whether verifyit should always fix grader bugs. Benjamin Feuer [pushed back](https://discord.com/channels/1354881461060243556/1366632114316906506/1556895055120171019) — some benchmarks (especially IF ones) rely on strict graders. The team converged on a clear policy: **keep original graders for evals, fix graders for training ingestion** ([Russell Power's summary](https://discord.com/channels/1354881461060243556/1366632114316906506/1557076569510510733)). dlwh opened [PR #9803](https://github.com/marin-community/marin/pull/9803) implementing this. Separately, Mark shared a [design doc for RL environment generation](https://docs.google.com/document/d/1fsmRFqvH1LzcByF77_vA0FA0Zwd3RazBEisexFJr1f0/edit?tab=t.0), and Russell Power shared the [flip-side doc for ingesting existing datasets](https://docs.google.com/document/d/18NrzFyAmjXrBmg0ov-VZLhj-ynwGRc1qqDGf1qtyxgg/edit?tab=t.0#heading=h.u1esostza7lu).

## <#1516150256499163166> — MarinFold Progress

Tim O'Donnell posted the [weekly MarinFold update](https://discord.com/channels/1354881461060243556/1516150256499163166/1556745190524325930). Key milestones: the **protein complex model finished training** with 3.4M complex documents, reducing inter-chain contact loss from 3.452 → 2.541 nats/token ([#343](https://github.com/Open-Athena/MarinFold/issues/343), [#349](https://github.com/Open-Athena/MarinFold/issues/349)), though monomer R-precision dipped slightly. Six **Qwen3.5 fine-tuning trials** (0.8B/2B/4B) launched on contacts-v1 documents ([#347](https://github.com/Open-Athena/MarinFold/issues/347)), with focus narrowing to the 4B model. The full-corpus **delta-stream run** reached 0.443 R-precision at 60% of an epoch ([#299](https://github.com/Open-Athena/MarinFold/issues/299)). Tim also announced a poster at MoML next Wednesday and cancelled the Oct 13 meeting due to the holiday.

## <#1374989195109466122> — SFT & RL Post-Training

marianna13 shared [SFT recovery mix results](https://discord.com/channels/1354881461060243556/1374989195109466122/1556659093668896839) for Grug — SWE-bench Verified jumped from 19.3 → **40** on a random 100 subset, and Terminal-Bench 2.1 improved from 5 → 9. Harshit Varma introduced a [new SFT filtering approach](https://discord.com/channels/1354881461060243556/1374989195109466122/1558422015386456084) loosely inspired by DAPO-style GRPO that showed additional gains on TB2, TB-Lite, and SWE-Bench Verified. Benjamin Feuer posted extensive [model merging experiments](https://discord.com/channels/1354881461060243556/1374989195109466122/1557985230076387432) showing that narrow RLVR can unpredictably affect non-targeted benchmarks, and recommended the team pivot to the strongest Snowball checkpoint (`Grug-67B-A2B-Antidoom-RLVR1-Step12`) which scores 31/21/11 on SWE-Bench/OT-TBLite/TB2.1. He also shared [DPO experiments](https://discord.com/channels/1354881461060243556/1374989195109466122/1558833303463923783) aimed at robustifying multi-harness performance.

## <#1365058937589858324> — Code Review & Dependency Management

Benjamin Feuer posted a batch of [TaskTrove pipeline fixes](https://discord.com/channels/1354881461060243556/1365058937589858324/1557635149925982300) (PRs [#9864](https://github.com/marin-community/marin/pull/9864)–[#9866](https://github.com/marin-community/marin/pull/9866)) covering CodeContests output comparisons and answer sorting. Russell Power [volunteered to review](https://discord.com/channels/1354881461060243556/1365058937589858324/1557865134083538995) since he'll be porting them to the new pipeline. He also proposed [publishing all marin-* libs to PyPI](https://discord.com/channels/1354881461060243556/1365058937589858324/1558264891410751579) via [PR #9982](https://github.com/marin-community/marin/pull/9982) to reduce dependency hell across SkyRL and other repos. Other PRs included RedSpidey's [tokenize-stage quality scoring](https://github.com/marin-community/marin/pull/9694) and Larry's [PTB eval text addition](https://github.com/marin-community/marin/pull/9776).

## <#1356487738840318002> — Evals & Scaling Analysis

Benjamin Feuer posted a [detailed analysis](https://discord.com/channels/1354881461060243556/1356487738840318002/1557776646918901994) of how eval policy benchmarks scale with FLOPS — generally predictable, with notable exceptions that could inform post-training scaling laws. willheld proposed [bumping the ACPX dependency](https://discord.com/channels/1354881461060243556/1356487738840318002/1557135341125898243) to fix T³ eval hangs (~50% failure rate), referencing [openclaw/acpx#430](https://github.com/openclaw/acpx/pull/430). Benjamin Feuer [approved](https://discord.com/channels/1354881461060243556/1356487738840318002/1557227319024816240) the bump since it shouldn't favor any particular model.

## <#1527756652890161292> — Architecture Explorations

Matheart shared a paper on [low-rank routers for MoE models](https://www.alphaxiv.org/pdf/2609.36301) targeting 2048–4096+ experts, noting that routing score I/O becomes expensive at large expert counts. Larry [reported](https://discord.com/channels/1354881461060243556/1527756652890161292/1557240641451200613) finding near-perfect query-key alignment (cosine similarity >0.9) in Marin Belay's partial key offset dimensions, leading to a merged projection that cuts 50% of Q flops with lower loss. He cautioned this relies on small batch-to-vocab ratios. Larry also [explored](https://discord.com/channels/1354881461060243556/1527756652890161292/1558585587479617694) sparse computation ideas paired with YOCO, where the second half of the network could skip easy-token compute.

## <#1554878678549397595> — AMD Porting

amy [reported](https://discord.com/channels/1354881461060243556/1554878678549397595/1556711937612579066) completing the first full Grug snowball run on AMD MI300X GPUs using JAX, resolving issue #9462. MFU tracking is now consolidated in [#9812](https://github.com/marin-community/marin/issues/9812). The team is establishing baseline numbers and investigating why JAX out-of-the-box leaves some compute on the table compared to PyTorch.

## <#1484315476325826660> — OpenThoughts-Next & Data Quality

Charlie R and Neha Hulkund reached out to Franziska Weindel about the RL data cleaning/sourcing effort. Sankalp Jajee submitted [OT-next-data PR #1](https://github.com/MLI-lab/OT-next-data/pull/1) for review. Bilibird flagged a significant finding: [2/3 of Mimo's coding tasks contain solutions in upstream files](https://www.vals.ai/blogs/mimo-reward-hacking) not caught by regular audits.

## <#1375164400239120504> — Community Growth

77 new members joined via #welcome-room across three waves (Oct 6, 7, and 10). Seven members posted introductions in <#1357057383830126652>, including tane (Stanford sophomore, Percy Liang's student), RedSpidey/Himanshu (already contributing from Hark Labs), Guillaume Delore (EU-based full-stack/ML engineer), and several others from Columbia, SJSU, and industry.

## News & Research

- **Reflection AI's Beam model released** — dlwh [noted](https://discord.com/channels/1354881461060243556/1356487690559684638/1556773928469274724) it has very similar specs to Marin's and will likely be a comparison point. Pretrained on 23.8T tokens with 100M+ RL rollouts.
- **Emergent misalignment** — Neha Hulkund shared [an Anthropic paper](https://www-cdn.anthropic.com/daad4360a8bdc707f8b22e3e745796ba27e57fb3.pdf) on emergent misalignment.
- **Mimo reward hacking** — [Two-Thirds of MiMo's Coding Tasks Leak Solutions](https://www.vals.ai/blogs/mimo-reward-hacking) found via upstream file contamination.
- **xprof-rs** — Pinak shared <https://github.com/Locamage/xprof-rs>, a faster alternative to base xprof; Russell Power confirmed the team is already using it on their shared xprof server, and Pinak offered to publish to PyPI.
- **RL-Explorer** — Neha Hulkund shared <https://huggingface.co/spaces/FineEnvs/RL-Explorer> for browsing RL environments (though Benjamin Feuer noted it doesn't distinguish environments from benchmarks).
- **Compute → Architecture** — satyaki [tweeted](https://x.com/satyaki_u/status/2107777211851833345?s=20) about how compute allocation shapes architecture; Mark [responded](https://discord.com/channels/1354881461060243556/1357080963472949428/1557476227055493152) with concrete examples from NVL72 training decisions.
