import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box, List, ListItem, ListItemText, Divider } from '@mui/material'

type Props = {
    open: boolean
    onClose: () => void
}

export function HelpDialog({ open, onClose }: Props) {
    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>Transit Map Editor - User Guide</DialogTitle>
            <DialogContent>
                <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom>Getting Started</Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                        The Transit Map Editor is a browser-based tool for creating schematic transit maps with octolinear (45° and 90°) routing.
                    </Typography>
                </Box>

                <Divider sx={{ mb: 2 }} />

                <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom>Tools</Typography>
                    <List dense>
                        <ListItem>
                            <ListItemText
                                primary="Select Tool"
                                secondary="Click and drag to select stations and segments. Drag selected items to move them."
                            />
                        </ListItem>
                        <ListItem>
                            <ListItemText
                                primary="Station Tool"
                                secondary="Click anywhere on the canvas to create a new station. Stations snap to the grid."
                            />
                        </ListItem>
                        <ListItem>
                            <ListItemText
                                primary="Segment Tool"
                                secondary="Click on a station to start creating a segment, then click on another station to connect them. Segments automatically snap to octolinear angles."
                            />
                        </ListItem>
                    </List>
                </Box>

                <Divider sx={{ mb: 2 }} />

                <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom>Creating Lines</Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                        When using the Segment tool, you must select a line from the dropdown before creating segments. To create a new line:
                    </Typography>
                    <List dense>
                        <ListItem>
                            <ListItemText
                                primary="1. Click the '+ Line' button"
                            />
                        </ListItem>
                        <ListItem>
                            <ListItemText
                                primary="2. Enter a name for the line"
                            />
                        </ListItem>
                        <ListItem>
                            <ListItemText
                                primary="3. Select a color from the palette"
                            />
                        </ListItem>
                        <ListItem>
                            <ListItemText
                                primary="4. Click 'Create' to add the line"
                            />
                        </ListItem>
                    </List>
                </Box>

                <Divider sx={{ mb: 2 }} />

                <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom>Keyboard Shortcuts</Typography>
                    <List dense>
                        <ListItem>
                            <ListItemText
                                primary="Ctrl+Z / Cmd+Z"
                                secondary="Undo last action"
                            />
                        </ListItem>
                        <ListItem>
                            <ListItemText
                                primary="Ctrl+Y / Cmd+Shift+Z"
                                secondary="Redo last action"
                            />
                        </ListItem>
                        <ListItem>
                            <ListItemText
                                primary="Delete / Backspace"
                                secondary="Delete selected stations and segments"
                            />
                        </ListItem>
                    </List>
                </Box>

                <Divider sx={{ mb: 2 }} />

                <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom>View Controls</Typography>
                    <List dense>
                        <ListItem>
                            <ListItemText
                                primary="Zoom In (+)"
                                secondary="Click the Zoom In button in the toolbar to zoom in on the canvas"
                            />
                        </ListItem>
                        <ListItem>
                            <ListItemText
                                primary="Zoom Out (-)"
                                secondary="Click the Zoom Out button in the toolbar to zoom out"
                            />
                        </ListItem>
                        <ListItem>
                            <ListItemText
                                primary="Reset View"
                                secondary="Click the Reset View button to return to the default zoom level (1:1) and center the canvas"
                            />
                        </ListItem>
                        <ListItem>
                            <ListItemText
                                primary="Mouse Wheel"
                                secondary="Use the mouse wheel to zoom in and out at the cursor position"
                            />
                        </ListItem>
                    </List>
                </Box>

                <Divider sx={{ mb: 2 }} />

                <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom>Export</Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                        Use the 'Export SVG' button to save your map as a vector file, or 'Export PNG' to save as a raster image.
                    </Typography>
                </Box>

                <Divider sx={{ mb: 2 }} />

                <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom>Background Image</Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                        Load a background image (e.g., a city map) to help with positioning. Toggle visibility with the 'Show/Hide BG' button.
                    </Typography>
                </Box>

                <Divider sx={{ mb: 2 }} />

                <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom>Auto-save</Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                        The editor automatically saves your work to your browser's local storage. Your stations, segments, lines, and active tool are saved automatically and will be restored when you return to the editor.
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                        Note: The undo/redo history and viewport position are not saved between sessions.
                    </Typography>
                </Box>

                <Divider sx={{ mb: 2 }} />

                <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom>Grid Size</Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                        Adjust the grid size for more precise station placement. Range: 10-100.
                    </Typography>
                </Box>

                <Divider sx={{ mb: 2 }} />

                <Box>
                    <Typography variant="h6" gutterBottom>Tips</Typography>
                    <List dense>
                        <ListItem>
                            <ListItemText
                                primary="• Use the mouse wheel to zoom in and out"
                            />
                        </ListItem>
                        <ListItem>
                            <ListItemText
                                primary="• Hold the middle mouse button to pan the canvas"
                            />
                        </ListItem>
                        <ListItem>
                            <ListItemText
                                primary="• Segments automatically snap to 45° and 90° angles for clean, professional-looking maps"
                            />
                        </ListItem>
                        <ListItem>
                            <ListItemText
                                primary="• Use undo/redo frequently to experiment with different layouts"
                            />
                        </ListItem>
                    </List>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Close</Button>
            </DialogActions>
        </Dialog>
    )
}
