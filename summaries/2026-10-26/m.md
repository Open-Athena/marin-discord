## <#1540486417078296576> — Hero Run Stability

dlwh [reported](https://discord.com/channels/1354881461060243556/1540486417078296576/1564384607229444188) that the team investigated the softmax collapse issue circulating in the community and found Marin likely unaffected, but a subsequent analysis uncovered a [backward attention gradient issue](https://github.com/marin-community/marin-logbooks/issues/12) disproportionately impacting one global attention layer. The root cause was that attention output wasn't being kept in FP32, related to the [gproj](https://arxiv.org/html/2609.34272v1) technique. Larry [noted](https://discord.com/channels/1354881461060243556/1540486417078296576/1564862346630012960) that qk-norm without per-head learnable sharpness should constrain attention logits, making the softmax issue unlikely.

Trials with FP32 saved attention output [showed](https://discord.com/channels/1354881461060243556/1540486417078296576/1565112976074088449) Q/K gradient error dropping from ~0.9% to ~0.3%, and the concentrated layer-15 error falling from ~4.5% to ~0.3%, with only ~1% step time hit. However, Larry [found no loss change](https://discord.com/channels/1354881461060243556/1540486417078296576/1565714998951420025) in a 50-step test ([issue](https://github.com/marin-community/marin/issues/10785)), so the precision fix was deprioritized. Instead, Larry opened a [PR for global grad clip at 1](https://github.com/marin-community/marin/pull/10783) after observing a grad spike that caused elevated loss for ~50 steps.

## <#1356490712199462912> — Scaling Laws & Predictability

dlwh [raised concern](https://discord.com/channels/1354881461060243556/1356490712199462912/1564473079869214742) that after re-examining the Delphi scaling laws blog, he couldn't identify how the team should have predicted the first recipe's blowup, calling the current understanding "alchemy." Percy Liang [suggested](https://discord.com/channels/1354881461060243556/1356490712199462912/1564509026505466009) examining norms and other stats for scale invariance violations. willheld [offered](https://discord.com/channels/1354881461060243556/1356490712199462912/1564618116867162204) to do a retrospective analysis with evolved understanding.

cole [proposed](https://discord.com/channels/1354881461060243556/1356490712199462912/1564739470522319091) that isoflop smoothness could serve as a proxy for stability—methods with unpredictable scaling at small scale are likely unpredictable at large scale. Kaiyue-Wen [suggested](https://discord.com/channels/1354881461060243556/1356490712199462912/1564780992810459237) the original recipe likely had outliers and attention sink behavior making runs more volatile. A new scaling law paper was [shared](https://discord.com/channels/1354881461060243556/1356490712199462912/1566289926251749496), with hmdolatabadi [cautioning](https://discord.com/channels/1354881461060243556/1356490712199462912/1566300780741267597) about overfitting predictors to observed curves.

## <#1374989195109466122> — RL Post-Training Results

marianna13 [shared RL data ablations](https://discord.com/channels/1354881461060243556/1374989195109466122/1565050956456919342) on SFT'd [Snowball](https://huggingface.co/marianna13/Grug-67B-A2B-Antidoom-RLVR1-Step12-SFT-mix-v4-think-step465): TMax gives the most consistent gains, pass-rate filtering helps, more epochs improve performance but risk overfitting, and more data doesn't always mean better results. lukedhlee [posted a blog](https://discord.com/channels/1354881461060243556/1374989195109466122/1565148345473835069) on turning Snowball into a coding agent, achieving **50.5% SWE-Bench 100** and **23.9% TB2.1** via SFT+RL.

dml [introduced PivotRL experiments](https://discord.com/channels/1354881461060243556/1374989195109466122/1565815149908988048), which combines SFT data efficiency with RL generalization. Wenhao Chai shared the [FrontierCS benchmark](https://frontier-cs.org/) for CS R&D evaluation.

## <#1527756652890161292> — Architecture & MFU Discussion

In response to questions about the hero run's initially low MFU, dlwh [explained](https://discord.com/channels/1354881461060243556/1527756652890161292/1564824251754610710) that 20% MFU isn't terrible for high-sparsity MoE at multi-rack scale without FP8, and that the team made a deliberate tradeoff to start training immediately when hardware arrived rather than spending weeks optimizing. He also noted that fresh hardware has a "shockingly high failure rate." cole [shared](https://discord.com/channels/1354881461060243556/1527756652890161292/1564875645664624782) a related architecture post.

## <#1484315476325826660> — OpenThoughts Data Pipeline

Franziska Weindel shared work on a static rubric task checker. marianna13 [noted](https://discord.com/channels/1354881461060243556/1484315476325826660/1565318398731096094) that Nemotron base is behaving more like a base model. Bilibird [observed](https://discord.com/channels/1354881461060243556/1484315476325826660/1565340467393069069) that most models show worse IFEval when thinking is enabled, and [asked](https://discord.com/channels/1354881461060243556/1484315476325826660/1565426960593723583) whether the most critical bottleneck is a more scalable LLM-as-a-judge solution.

## <#1354881461060243561> — Community Updates

Percy Liang [announced](https://discord.com/channels/1354881461060243556/1354881461060243561/1564508449864286221) the community meeting was canceled due to NYC festivities, with the next one in two weeks focused on post-training. Jeff H [created](https://discord.com/channels/1354881461060243556/1354881461060243561/1565987025784541278) a new <#1565985029950279773> channel for math-focused discussions. A wave of ~28 new members joined, with introductions from researchers spanning high school to postdoc levels.

## <#1357080963472949428> — Questions & External Collaboration

StellaAthena asked about scaling law forecasting and dlwh [pointed to](https://discord.com/channels/1354881461060243556/1357080963472949428/1564363270050152468) the Delphi blog post, hero forecast code, and Paloma preregistration. They discussed equi-D/P vs equi-token extrapolation approaches. dlwh mentioned work on a [speed run mechanism](https://github.com/marin-community/marin/issues/9451) for external compute sharing.

Matheart [expressed interest](https://discord.com/channels/1354881461060243556/1357080963472949428/1565031820779724914) in doing observational studies on Marin's 117,820 wandb runs, noting the scale makes human understanding difficult and suggesting agentic labeling approaches. dlwh acknowledged the runs should theoretically be linked to GitHub issues but compliance has atrophied.

## <#1483266366772351067> — Midtraining & Chat Templates

Benjamin Feuer [flagged](https://discord.com/channels/1354881461060243556/1483266366772351067/1564944399245246564) that base models vary widely in their propensity to produce assistant-style answers and think traces, confounded by chat template design itself ([issue](https://github.com/marin-community/marin/issues/10751)).

## News & Research

- Pinak shared [Finch-1](https://locamage.com/blog/finch-1) from Locamage
- Sway [demoed](https://discord.com/channels/1354881461060243556/1376621616531902554/1564566570850713611) converting a Qwen model to use a new tokenizer; dlwh said a tokenizer update is on the roadmap but months away
- Charlie R [shared](https://discord.com/channels/1354881461060243556/1368297424086499359/1565526089865105532) IFM AI's task-factory for synthesizing RL tasks from GitHub PRs
- TheWizard shared a paper on [omnimodal model implications](https://www.alphaxiv.org/abs/2610.39302); eskit shared a related [parameter-efficient VLM training paper](https://arxiv.org/abs/2610.09411)
- Jeff H kicked off <#1565985029950279773> with the [Harvard Summit on Math Research in the Age of AI report](https://cmsa.fas.harvard.edu/aimathresearch_summit/)
- dlwh [proposed](https://discord.com/channels/1354881461060243556/1366632114316906506/1564144277624328273) adding periodic critical-path rechecks to agents.md to prevent agents from going down rabbit holes
- Mars Gao joined <#1418673157585502370>, interested in DNA foundation models and mid-training from Qwen 14B
