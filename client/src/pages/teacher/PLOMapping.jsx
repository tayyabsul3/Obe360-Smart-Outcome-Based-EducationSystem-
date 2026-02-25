import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GitMerge, Layers, ArrowLeft, Save, Info } from 'lucide-react';
import { toast } from 'sonner';
import useLoaderStore from '@/store/loaderStore';

export default function PLOMapping() {
    const { courseId } = useParams();
    const { state } = useLocation();
    const navigate = useNavigate();
    const { showLoader, hideLoader } = useLoaderStore();

    const clo = state?.clo; // Passed from CLOManager

    const [batches, setBatches] = useState([]);
    const [plos, setPlos] = useState([]);
    const [loading, setLoading] = useState(true);

    const [formData, setFormData] = useState({
        batch_id: 'none',
        plo_id: 'none',
        learning_type: clo?.type || 'Cognitive',
        level: 'C1',
        emphasis_level: 'Low'
    });

    useEffect(() => {
        if (!clo) {
            toast.error("No CLO selected for mapping");
            navigate(`/teacher/course/${courseId}/clos`);
            return;
        }
        fetchMeta();
    }, [courseId]);

    const fetchMeta = async () => {
        setLoading(true);
        try {
            // Fetch Batches
            const bRes = await fetch('http://localhost:5000/api/students/batches');
            if (bRes.ok) setBatches(await bRes.json());

            // Fetch PLOs for this course
            const pRes = await fetch(`http://localhost:5000/api/programs/plos/course/${courseId}`);
            if (pRes.ok) setPlos(await pRes.json());
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (formData.plo_id === 'none') return toast.warning("Please select a PLO");

        showLoader();
        try {
            const res = await fetch('http://localhost:5000/api/clos/map', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    clo_id: clo.id,
                    ...formData
                })
            });

            if (res.ok) {
                toast.success("Mapping Saved Successfully");
                navigate(`/teacher/course/${courseId}/clos`);
            } else {
                toast.error("Failed to save mapping");
            }
        } catch (error) {
            toast.error("Network error");
        } finally {
            hideLoader();
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            {/* Context Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                        <ArrowLeft size={20} />
                    </Button>
                    <div>
                        <h2 className="text-xl font-black text-slate-800 tracking-tight">PLO MAPPING</h2>
                        <p className="text-xs text-slate-500 font-bold uppercase">
                            Mapping for <span className="text-blue-600 font-black">{clo?.code}</span>
                        </p>
                    </div>
                </div>
                <Button onClick={handleSave} className="bg-[#337AB7] gap-2 font-bold px-6">
                    <Save size={16} /> SAVE MAPPING
                </Button>
            </div>

            {/* Info Card */}
            <Card className="bg-blue-50/50 border-blue-100 border-l-4">
                <CardContent className="p-4 flex gap-4">
                    <div className="bg-blue-600 p-2 rounded-lg text-white h-fit">
                        <Info size={20} />
                    </div>
                    <div>
                        <h4 className="font-bold text-sm text-blue-900">CLO Content</h4>
                        <p className="text-sm text-blue-700 leading-relaxed italic">"{clo?.description}"</p>
                    </div>
                </CardContent>
            </Card>

            {/* Mapping Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="shadow-sm border-slate-200">
                    <CardHeader className="bg-slate-50 border-b">
                        <CardTitle className="text-xs font-black uppercase text-slate-600 flex items-center gap-2">
                            <Layers size={14} /> Basic Definition
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-700 uppercase">Select Batch</label>
                            <Select value={formData.batch_id} onValueChange={(v) => setFormData({ ...formData, batch_id: v })}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Batch..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none" disabled>Select Batch</SelectItem>
                                    {batches.map(b => (
                                        <SelectItem key={b.batch} value={b.batch}>{b.batch}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-700 uppercase">Select PLO</label>
                            <Select value={formData.plo_id} onValueChange={(v) => setFormData({ ...formData, plo_id: v })}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select PLO..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none" disabled>Select PLO</SelectItem>
                                    {plos.map(p => (
                                        <SelectItem key={p.id} value={p.id}>PLO-{p.plo_number}: {p.title}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-sm border-slate-200">
                    <CardHeader className="bg-slate-50 border-b">
                        <CardTitle className="text-xs font-black uppercase text-slate-600 flex items-center gap-2">
                            <GitMerge size={14} /> Learning Attributes
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-700 uppercase">Learning Type</label>
                            <Select value={formData.learning_type} onValueChange={(v) => setFormData({ ...formData, learning_type: v })}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Cognitive">Cognitive</SelectItem>
                                    <SelectItem value="Psychomotor">Psychomotor</SelectItem>
                                    <SelectItem value="Affective">Affective</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-700 uppercase">Level</label>
                                <Select value={formData.level} onValueChange={(v) => setFormData({ ...formData, level: v })}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="C1">C1</SelectItem>
                                        <SelectItem value="C2">C2</SelectItem>
                                        <SelectItem value="C3">C3</SelectItem>
                                        <SelectItem value="C4">C4</SelectItem>
                                        <SelectItem value="P1">P1</SelectItem>
                                        <SelectItem value="P2">P2</SelectItem>
                                        <SelectItem value="A1">A1</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-700 uppercase">Emphasis</label>
                                <Select value={formData.emphasis_level} onValueChange={(v) => setFormData({ ...formData, emphasis_level: v })}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Low">Low</SelectItem>
                                        <SelectItem value="Medium">Medium</SelectItem>
                                        <SelectItem value="High">High</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
