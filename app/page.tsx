'use client';

import { HocuspocusProvider } from '@hocuspocus/provider';
import { withCursors, withYHistory, withYjs, YjsEditor } from '@slate-yjs/core';
import React, { useEffect, useMemo, useState } from 'react';
import type { Descendant } from 'slate';
import { createEditor } from 'slate';
import { Slate, withReact } from 'slate-react';
import { XmlText } from 'yjs';
import { CustomEditable } from '../components/CustomEditable/CustomEditable';
import { FormatToolbar } from '../components/FormatToolbar/FormatToolbar';
import { withMarkdown } from '../plugins/withMarkdown';
import { withNormalize } from '../plugins/withNormalize';
import { randomCursorData } from '../utils';
import { RemoteCursorOverlay } from '../components/Overlay';

const HOCUSPOCUS_ENDPOINT_URL = 'ws://0.0.0.0:1234';

export default function RemoteCursorsOverlayPage() {
    const [value, setValue] = useState<Descendant[]>([]);
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        console.log('connected', connected);
    }, [connected]);

    const provider = useMemo(
        () =>
            new HocuspocusProvider({
                url: HOCUSPOCUS_ENDPOINT_URL,
                name: 'sweez-collaboration',
                onConnect: () => setConnected(true),
                onDisconnect: () => setConnected(false),
                connect: false,
            }),
        []
    );

    const editor = useMemo(() => {
        const sharedType = provider.document.get('content', XmlText) as XmlText;

        return withMarkdown(
            withNormalize(
                withReact(
                    withYHistory(
                        withCursors(
                            withYjs(createEditor(), sharedType, {
                                autoConnect: false,
                            }),
                            provider.awareness,
                            {
                                data: randomCursorData(),
                            }
                        )
                    )
                )
            )
        );
    }, [provider.awareness, provider.document]);

    // Connect editor and provider in useEffect to comply with concurrent mode
    // requirements.
    useEffect(() => {
        provider.connect();
        return () => provider.disconnect();
    }, [provider]);
    useEffect(() => {
        YjsEditor.connect(editor);
        return () => YjsEditor.disconnect(editor);
    }, [editor]);

    return (
        <React.Fragment>
            <Slate value={value} onChange={setValue} editor={editor} initialValue={[]}>
                <RemoteCursorOverlay className='flex justify-center mx-10 my-32'>
                    <CustomEditable className='flex-col w-full max-w-4xl break-words' />
                </RemoteCursorOverlay>
            </Slate>
        </React.Fragment>
    );
}
