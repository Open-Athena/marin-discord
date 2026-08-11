## <#1516150256499163166> — MarinFold Progress & Measurement Issues

Tim O'Donnell posted the [weekly MarinFold update](https://discord.com/channels/1354881461060243556/1516150256499163166/1533900986446385202): two new models show modest improvement — Eric Czech's amino-acid augmentation run ([#166](https://github.com/Open-Athena/MarinFold/issues/166), [#190](https://github.com/Open-Athena/MarinFold/pull/190)) achieves **2.664 val loss / 0.562 R-precision**, and Tim's ESMFold2 distillation run ([#155](https://github.com/Open-Athena/MarinFold/issues/155), [#192](https://github.com/Open-Athena/MarinFold/pull/192)) also improved. However, a [measurement confusion](https://discord.com/channels/1354881461060243556/1516150256499163166/1533901028351545486) caused by [marin#7209](https://github.com/marin-community/marin/pull/7209) inflated observed losses by ~0.42 nats, with [marin#7921](https://github.com/marin-community/marin/pull/7921) submitted as a workaround. Both post-training lines (backtracking and rollout refinement) are on hold due to implementation bugs — sorted ground-truth contacts ([#159](https://github.com/Open-Athena/MarinFold/issues/159)) and wrong rope scoring ([#163](https://github.com/Open-Athena/MarinFold/issues/163)). Tim also [noted](https://discord.com/channels/1354881461060243556/1516150256499163166/1533901171218059425) that the coarse fold is the bottleneck, not refinement, and the team is considering abandoning voxel-based approaches in favor of a bespoke diffusion model for 3D coordinate prediction.

## <#1484315476325826660> — OpenThoughts-Next Onboarding & Coordination

JeniaJitsev [announced](https://discord.com/channels/1354881461060243556/1484315476325826660/1534305402206949438) that Harsh Raj and Huu Nguyen will contribute to OT-Next from their side, requesting access to core channels. Benjamin Feuer [pushed back](https://discord.com/channels/1354881461060243556/1484315476325826660/1534306587106214160) on gatekeeping, noting all OT-Agent work was done in public channels, and renamed the channel accordingly. conceptofmind [asked twice](https://discord.com/channels/1354881461060243556/1484315476325826660/1534605428175143174) for data leads contacts. Mrinal Kumar and Neha Hulkund noted they'd miss the weekly meeting and follow up async.

## <#1374989195109466122> — Reinforcement Learning Meeting & Paper

The RL meeting hit [Zoom access issues](https://discord.com/channels/1354881461060243556/1374989195109466122/1534230591887769650) — marianna13 couldn't admit people, so Mrinal Kumar spun up a Google Meet. JeniaJitsev [tagged the RL track](https://discord.com/channels/1354881461060243556/1374989195109466122/1534242194678874123) asking contributors to follow up in notes, and shared a new paper: <https://arxiv.org/abs/2607.05391>.

## <#1406020028884717719> — Safety Training & FAR.AI Accelerator

G Sandoval [filed issue #7931](https://github.com/marin-community/marin/issues/7931) on bio-safety data filtering. Percy Liang [responded](https://discord.com/channels/1354881461060243556/1406020028884717719/1534069104149921933) supporting filtering dangerous capabilities from pre-training data as long as general bio knowledge is preserved. G Sandoval [compiled prior work](https://discord.com/channels/1354881461060243556/1406020028884717719/1534254457888702515) including [Deep Ignorance](https://arxiv.org/abs/2508.06601), [gpt-oss](https://arxiv.org/abs/2508.03153), and [Rathi & Radford](https://arxiv.org/abs/2601.21571). Huu Nguyen [suggested](https://discord.com/channels/1354881461060243556/1406020028884717719/1534263384348950709) alignment injection into risky data rather than nerfing it. dlwh [announced](https://discord.com/channels/1354881461060243556/1406020028884717719/1535818100824604672) FAR.AI's Open-Weight Pre-Training Safety Accelerator, offering compute and collaboration support for university researchers working on open-weight model safety.

## <#1356490712199462912> — Scaling Law Questions & Mumwelt

Kyle O'Brien [asked](https://discord.com/channels/1354881461060243556/1356490712199462912/1534490091924488286) whether Chinchilla token budgets for MoE models should be based on active or total parameters. ahmet [asked](https://discord.com/channels/1354881461060243556/1356490712199462912/1536045100713517067) about how the power law asymptotes (1.6 for dense, 1.4 for MoE) are selected. Jeff H [pointed to Mumwelt](https://discord.com/channels/1354881461060243556/1356490712199462912/1536051688417394708) (<https://github.com/Open-Athena/mumwelt>) for an explanation and filed [issue #8096](https://github.com/marin-community/marin/issues/8096) to improve visibility of scaling law methodology.

## <#1527756652890161292> — Linear Attention Implementation

Mayank [reported](https://discord.com/channels/1354881461060243556/1527756652890161292/1533808278734245939) a linear attention implementation achieving **~29B tokens/day on a 1B model vs 32B/day for softmax** on 4× TPU v6e using torch-xla — near parity, though causal conv drops it to 17B/day. He's [working on optimizing](https://discord.com/channels/1354881461060243556/1527756652890161292/1533817252866949241) causal convolution speed. markhart0034 [warned](https://discord.com/channels/1354881461060243556/1527756652890161292/1534568314200916159) that causal convs increase KV-cache during inference unless only applied to KV.

## <#1462895580064911522> — Data Mixing: Global Deduplication Complete

willheld [announced](https://discord.com/channels/1354881461060243556/1462895580064911522/1535103694612467723) completion of global deduplication across the 292-source registry: from 18.7B documents / 25.6T tokens down to **14.4B documents / ~19.7T tokens retained (77%)**. He also [noted](https://discord.com/channels/1354881461060243556/1462895580064911522/1535103489410080869) a preference for filled structured documents over unfilled ones, expecting the latter to score low in the quality pipeline.

## <#1356487738840318002> — Evals Policy & New PR

Benjamin Feuer [outlined](https://discord.com/channels/1354881461060243556/1356487738840318002/1534217574148083783) Marin's canonical eval reporting policy, emphasizing transparency standards for open development. boreas [submitted their first PR](https://discord.com/channels/1354881461060243556/1356487738840318002/1534316239298494696) — [evalchemy#59](https://github.com/marin-community/evalchemy/pull/59) addressing item 16 of the eval wishlist.

## <#1365044508546568372> — MoE Training Update

Benjamin Feuer [noted](https://discord.com/channels/1354881461060243556/1365044508546568372/1533934832692891803) the main 10T MoE run is looking good. dlwh [shared](https://discord.com/channels/1354881461060243556/1365044508546568372/1534434426371702855) the Cursor mixture-of-kittens repo (<https://github.com/cursor/mixture-of-kittens>) as related to what he'd been trying to implement.

## Community & Questions

18 new members joined via <#1375164400239120504>. In <#1357080963472949428>, Matheart asked about the largest Marin runs; willheld [confirmed](https://discord.com/channels/1354881461060243556/1357080963472949428/1535365947416649760) the [Marin-32B retro](https://marin.readthedocs.io/en/latest/reports/marin-32b-retro/) is still the largest by FLOPs. Ricardo Olmedo [requested](https://discord.com/channels/1354881461060243556/1357080963472949428/1535403404724011049) release of intermediate Snowball checkpoints for joint pre-training/fine-tuning scaling law research. Percy Liang [announced](https://discord.com/channels/1354881461060243556/1354881461060243561/1534067006142283806) Larry's architecture overview presentation.

## News & Research

- Gonzalo Benegas [published the MarinDNA blog post](https://discord.com/channels/1354881461060243556/1418673157585502370/1534940313997803541): <https://openathena.ai/blog/marin-dna/> (most-reacted message of the week with 5 reactions)
- JeniaJitsev shared an RL paper: <https://arxiv.org/abs/2607.05391>
- Safety-relevant papers discussed: [Deep Ignorance](https://arxiv.org/abs/2508.06601), [gpt-oss](https://arxiv.org/abs/2508.03153), [Rathi & Radford](https://arxiv.org/abs/2601.21571)
- dlwh shared Cursor's [mixture-of-kittens](https://github.com/cursor/mixture-of-kittens) repo
- Aleph Alpha Research [posted](https://discord.com/channels/1354881461060243556/1356487701133787160/1535029670486085823) a call for collaborators on recurrence-based LLM reasoning
