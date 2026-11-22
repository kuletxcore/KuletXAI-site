"""Hostile-markup fixtures for build_isk.sanitize(). Run: python3 -m unittest discover -s scripts -p 'test_*.py'"""
import importlib.util
import os
import unittest

HERE = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location('build_isk', os.path.join(HERE, 'build_isk.py'))
build_isk = importlib.util.module_from_spec(spec)
spec.loader.exec_module(build_isk)
clean = build_isk.sanitize

BAD = [
    '<script>alert(1)</script>',
    '<SCRIPT src=//x.test/a.js></SCRIPT>',
    '<img src=x onerror=alert(1)>',
    '<img src="x" ONLOAD="alert(1)">',
    '<a href="javascript:alert(1)">x</a>',
    '<a href=javascript:alert(1)>x</a>',
    '<a href="jav&#x09;ascript:alert(1)">x</a>',
    '<a href="&#106;avascript:alert(1)">x</a>',
    '<a href=" JaVaScRiPt:alert(1)">x</a>',
    '<a href="vbscript:msgbox(1)">x</a>',
    '<a href="data:text/html,<script>alert(1)</script>">x</a>',
    '<svg><a xlink:href="javascript:alert(1)"><text>x</text></a></svg>',
    '<iframe srcdoc="<script>alert(1)</script>"></iframe>',
    '<div srcdoc="x">x</div>',
    '<form action="javascript:alert(1)"><button>x</button></form>',
    '<button formaction="javascript:alert(1)">x</button>',
    '<object data="x.swf"></object>',
    '<embed src="x.swf">',
    '<meta http-equiv="refresh" content="0;url=javascript:alert(1)">',
    '<base href="//evil.test/">',
    '<div style="background:url(javascript:alert(1))">x</div>',
    '<div style="width:expression(alert(1))">x</div>',
    '<style>a{behavior:url(x.htc)}</style>',
    '<!-- <script>alert(1)</script> -->',
    '<details open ontoggle=alert(1)>x</details>',
]


class Sanitize(unittest.TestCase):
    def test_hostile_markup_is_defused(self):
        for raw in BAD:
            out = clean(raw).lower()
            with self.subTest(raw=raw):
                self.assertNotIn('<script', out)
                self.assertNotRegex(out, r'\son\w+\s*=')
                self.assertNotIn('javascript:', out.replace('&#', ''))
                self.assertNotIn('vbscript:', out)
                self.assertNotIn('srcdoc', out)
                self.assertNotIn('expression(', out)
                self.assertNotRegex(out, r'<\s*(iframe|object|embed|form|meta|base)\b')
                self.assertNotIn('data:text/html', out)

    def test_ordinary_markup_survives(self):
        good = [
            '<div style="color:#fff;background:#000">Behavior: calm, expression (smiling)</div>',
            '<a href="https://www.isekaizero.ai/storylines/x" target="_blank">Play</a>',
            '<img src="https://media.kagesekai.ai/a.webp" alt="">',
            '<img src="data:image/png;base64,AAAA" alt="">',
            '<table><tr><td>Onion rings</td></tr></table>',
        ]
        for raw in good:
            with self.subTest(raw=raw):
                self.assertEqual(clean(raw), raw)


class StoryText(unittest.TestCase):
    def test_fill_user_handles_pronoun_and_verb_agreement(self):
        self.assertEqual(build_isk.fill_user('{{user}} walks into the room.'), 'You walk into the room.')
        self.assertEqual(build_isk.fill_user("Tell {{user}} {{user}}'s plan."), 'Tell you your plan.')
        self.assertEqual(build_isk.fill_user('{{user}} has no clue and {{user}} tries anyway.'), 'You have no clue and you try anyway.')
        self.assertEqual(build_isk.fill_user('{{char}} smiles at {{user}}.', 'Mitsuki'), 'Mitsuki smiles at you.')

    def test_you_verb_irregulars_and_non_verbs(self):
        self.assertEqual(build_isk.you_verb('is'), 'are')
        self.assertEqual(build_isk.you_verb('was'), 'were')
        self.assertEqual(build_isk.you_verb('watches'), 'watch')
        self.assertEqual(build_isk.you_verb('always'), 'always')

    def test_story_text_applies_player_noun(self):
        self.assertEqual(
            build_isk.story_text('queen-bee', '{{user}} opens the door for {{user}}.'),
            'The new girl opens the door for the new girl.',
        )

    def test_tidy_caption_strips_prompt_and_picker_notes(self):
        self.assertEqual(build_isk.tidy_caption('Cover art: something long'), 'Cover art')
        self.assertEqual(
            build_isk.tidy_caption('A rainy street. Use for the opening scene.'),
            'A rainy street.',
        )


if __name__ == '__main__':
    unittest.main()
