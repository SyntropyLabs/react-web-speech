I was building an AI chatbot, I wanted to add a speech to text feature like the top AI apps have with the web speech api that browsers have inbuilt for people who don't want to pay for whisper etc and the complex setup that comes with it.

A mic when you click it, listens to you and enters whatever you say into a text input.
I wanted to add basic stuff like:
- mic permission handling
- listening state
- browser compatibility workarounds
- the text should enter where the cursor is
- etc
I realised that this basic stuff should be a package and i couldn't find any that does anything like such, there are basic wrappers around the web speech api but nothing else.

So this project is to make that package.

We'll use:
https://github.com/rolldown/tsdown/
https://tsdown.dev/recipes/react-support


I've created the github repo at: https://github.com/SyntropyLabs/react-web-speech
and reserved the organisation name for 'syntropy-labs'

Please research the web on how other people do it, research:
Basic principles of creating and maintaining an open source npm package.