# YBNCTF Christmas 2025 - Misc - Mushroom Farming experts
## Date uploaded 24 January 2026 ##

This challenge is about game hacking. It covers the basics of identifying the address of variables and editing it to "hack" the game. One such tool we can use to do so is via <span style = 'color:lightgreen'>Cheat Engine</span>. Using Cheat Engine, we can locate the address of different values and change them. You can find many tutorials on how to use cheat engine and using in python also so I won't get too concise on the exact steps.

In this challenge, it says we need <span style = 'color:lightgreen'>10 million mushrooms and coins</span> which we obviously have none to start with. We can farm a mushroom with f and after 1 minute, we can harvest it with h. This is obviously too slow to get to 10 million so let's use cheat engine.

We can attach the process to cheat engine and <span style = 'color:lightgreen'>start a scan of 0</span> as it is our original mushroom count. We can then harvest a mushroom and <span style = 'color:lightgreen'>start a next scan for 1</span>. We can continue until we narrow down to a few addresses. Trying something like scanning at 7 and then scanning again at 10 will be much more effective in narrowing the results than scanning every new mushroom harvested.

After narrowing down the address, we can put it in our address list and change the value of it to 10 million. If you see the mushroom value change to 10 million in our exe file, that means you got the address right! Nice. Now just for the coins. When I was doing the challenge, I originally thought this would be scanning for a non-changing value as I did not know how to get the coin but some trial and error, I found that the coins are simply auto add when you harvest a mushroom while having at least certain amount of mushrooms. That would be an interesting challenge if we have to locate the address of a non-changing value while its the most common number of 0. (That is a challenge for next time).

<img src="/writeups/YBNCTF Christmas 2025 - Misc - Mushroom Farming experts/image3.jpg" alt="image" style = "width:30%; height:auto; margin:1em auto ; display:block;">

With this, we can change our mushrooms to a high number and harvest mushroom to get a change in coin. With this, we can do the same steps to locate the address of the coin and change it to 10 million and there we get the flag.

<img src="/writeups/YBNCTF Christmas 2025 - Misc - Mushroom Farming experts/image1.png" alt="image" style = "width:50%; height:auto; margin:1em auto ; display:block;">

<img src="/writeups/YBNCTF Christmas 2025 - Misc - Mushroom Farming experts/image2.png" alt="image" style = "margin:1em auto; display:block;">

**Flag:** `YBN25{B1rD_G4M3_3_f0r_Chr1s7M45_YaHoo}`

**Difficulty:** Easy