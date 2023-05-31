import { FC, useEffect, useState, ChangeEvent, KeyboardEvent } from 'react';
import { Space, List, Input } from 'antd';
import { CloseOutlined, EnterOutlined } from '@ant-design/icons';

export const InputTags: FC<any> = (props) => {
    const { value = [], onChange } = props;
    const [tags, setTags] = useState(Array.from(new Set(value as string[])));
    const [inputVal, setInputVal] = useState('');
    //
    const handleEnter = (evt: KeyboardEvent<HTMLInputElement>) => {
        setInputVal('');
        const newTags = Array.from(new Set([...tags, (evt.target as any).value]));
        setTags(newTags);
        onChange(newTags);
    };

    const handleDel = (tag: string, index: number) => {
        const newTagSet = new Set(tags);
        newTagSet.delete(tag);
        const newTags = Array.from(newTagSet);
        setTags(newTags);
        onChange(newTags);
    };

    return (
        <div>
            <List bordered>
                {
                    tags.map((tag: string, index: number) => {
                        return <List.Item key={index} extra={<CloseOutlined onClick={() => { handleDel(tag, index); }} />}><div>{tag}</div></List.Item>;
                    })
                }
                <List.Item>
                    <Input onPressEnter={handleEnter} value={inputVal} onChange={(evt: ChangeEvent<HTMLInputElement>) => { setInputVal(evt.target.value); }} suffix={<EnterOutlined />} />
                </List.Item>
            </List>
        </div>
    );
};
